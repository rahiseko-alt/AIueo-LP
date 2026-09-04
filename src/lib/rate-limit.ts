import 'server-only';

import { db } from '@/lib/neon/db';

/**
 * 固定ウィンドウ方式の回数制限。
 *
 * 上流の Neon Auth は確認メール送信を60秒に3回へ制限しているが、その枠は
 * 呼び出し元IP単位、つまりこのアプリのサーバー単位で共有される。手前で止め
 * なければ、攻撃者がその共有枠を使い切り、正規の登録が全員通らなくなる。
 *
 * 判定と加算を1文のupsertで行うため、同時に来た要求が同じカウントを読んで
 * すり抜けることはない。
 */

export type RateLimitRule = {
  /** 対象の種類。キーの前置に使う */
  scope: string;
  /** ウィンドウの長さ（秒） */
  windowSeconds: number;
  /** ウィンドウあたりの上限回数 */
  max: number;
};

export type RateLimitResult =
  | { allowed: true }
  /** retryAfterSeconds は Retry-After ヘッダにそのまま入れられる秒数 */
  | { allowed: false; retryAfterSeconds: number };

/** データベースが無い環境では素通しする。呼び出し側が別途503を返す。 */
const ALLOWED: RateLimitResult = { allowed: true };

/**
 * 1回分を消費する。上限を超えていれば allowed: false と待ち時間を返す。
 *
 * @param identifier メールアドレスやIPなど、制限の対象
 */
export async function consumeRateLimit(
  identifier: string,
  rule: RateLimitRule,
): Promise<RateLimitResult> {
  if (!db) return ALLOWED;

  const bucketKey = `${rule.scope}:${identifier}`;

  // ウィンドウの開始時刻をDB側の now() から求める。アプリ側の時計に依存させない。
  // 競合しても upsert は1文なので、attempts は必ず順に積み上がる。
  const result = await db.$client.query(
    `insert into rate_limits (bucket_key, window_started_at, attempts)
     values ($1, to_timestamp(floor(extract(epoch from now()) / $2) * $2), 1)
     on conflict (bucket_key, window_started_at)
       do update set attempts = rate_limits.attempts + 1
     returning attempts, window_started_at`,
    [bucketKey, rule.windowSeconds],
  );

  const row = result.rows[0] as { attempts: number; window_started_at: string } | undefined;
  if (!row) return ALLOWED;

  if (row.attempts <= rule.max) return ALLOWED;

  const windowEndsAt = new Date(row.window_started_at).getTime() + rule.windowSeconds * 1000;
  const retryAfterSeconds = Math.max(1, Math.ceil((windowEndsAt - Date.now()) / 1000));
  return { allowed: false, retryAfterSeconds };
}

/**
 * 期限切れの行を消す。cron から呼ぶ。
 * 制限そのものはウィンドウが変われば別の行になるので、掃除が遅れても判定は狂わない。
 */
export async function pruneRateLimits(retainSeconds = 60 * 60 * 24): Promise<number> {
  if (!db) return 0;
  const result = await db.$client.query(
    `delete from rate_limits where window_started_at < now() - make_interval(secs => $1)`,
    [retainSeconds],
  );
  return result.rowCount ?? 0;
}
