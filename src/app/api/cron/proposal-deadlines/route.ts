import { timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/neon/db';
import { pruneRateLimits } from '@/lib/rate-limit';
import { withoutImageData } from '@/lib/proposals/image';

export const dynamic = 'force-dynamic';

/**
 * 開催日の3日前・7日前は、**開催日のJSTの日付と今日のJSTの日付の差**で決める
 * （MEMBERSHIP_FEATURE_SPEC.md 必須設計4項「最初の日付をJSTで判定」）。
 *
 * 以前は `now() + interval '3 days'` と時刻どうしで比べていたため、時刻を指定した
 * 企画と指定していない企画（00:00 JST で保存）で判定が1日ずれていた。
 */
const DAYS_UNTIL = "((tentative_starts_at at time zone 'Asia/Tokyo')::date - (now() at time zone 'Asia/Tokyo')::date)";

/** 重複送信防止の鍵に使う、開催日のJSTの日付。UTCの日付だと 00:00 JST が前日になる。 */
function jstDateKey(value: unknown) {
  return new Date(new Date(String(value)).getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const provided = request.headers.get('authorization');
  if (!provided) return false;
  // 文字列の === は先頭から一致するほど遅くなり、秘密値を1文字ずつ推測できる。
  const expectedBytes = Buffer.from(`Bearer ${secret}`);
  const providedBytes = Buffer.from(provided);
  if (expectedBytes.length !== providedBytes.length) return false;
  return timingSafeEqual(expectedBytes, providedBytes);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!db) return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });

  const client = await db.$client.connect();
  let expired = 0;
  let autoHidden = 0;
  let reminded = 0;
  let broken = false;
  try {
    await client.query('begin');
    const expiredRows = await client.query("select * from proposals where status = 'published' and public_expires_at <= now() for update");
    for (const proposal of expiredRows.rows) {
      const updated = await client.query("update proposals set status = 'expired' where id = $1 returning *", [proposal.id]);
      await client.query('insert into proposal_versions (proposal_id, reason_code, reason_text, snapshot) values ($1, $2, $3, $4::jsonb)', [proposal.id, 'public_expiry', '公開期限の到来', JSON.stringify(withoutImageData(updated.rows[0]))]);
      await client.query('insert into audit_log (entity_type, entity_id, action, before_state, after_state) values ($1, $2, $3, $4::jsonb, $5::jsonb)', ['proposal', proposal.id, 'cron_proposal_expired', JSON.stringify(proposal), JSON.stringify(withoutImageData(updated.rows[0]))]);
      await client.query('insert into notifications (recipient_id, proposal_id, kind, body, dedupe_key) values ($1, $2, $3, $4, $5) on conflict (dedupe_key) do nothing', [proposal.owner_id, proposal.id, 'proposal_expired', '公開期限を過ぎたため、企画を公開一覧から除外しました。', `expiry:${proposal.id}:${new Date(proposal.public_expires_at).toISOString().slice(0, 10)}`]);
      expired += 1;
    }

    const autoHideRows = await client.query(`select * from proposals where status = 'published' and event_status <> 'confirmed' and ${DAYS_UNTIL} between 0 and 3 for update`);
    for (const proposal of autoHideRows.rows) {
      const updated = await client.query("update proposals set status = 'auto_hidden' where id = $1 returning *", [proposal.id]);
      await client.query('insert into proposal_versions (proposal_id, reason_code, reason_text, snapshot) values ($1, $2, $3, $4::jsonb)', [proposal.id, 'unconfirmed_three_days_before', '候補日時の3日前までに開催決定なし', JSON.stringify(withoutImageData(updated.rows[0]))]);
      await client.query('insert into audit_log (entity_type, entity_id, action, before_state, after_state) values ($1, $2, $3, $4::jsonb, $5::jsonb)', ['proposal', proposal.id, 'cron_proposal_auto_hidden', JSON.stringify(proposal), JSON.stringify(withoutImageData(updated.rows[0]))]);
      await client.query('insert into notifications (recipient_id, proposal_id, kind, body, dedupe_key) values ($1, $2, $3, $4, $5) on conflict (dedupe_key) do nothing', [proposal.owner_id, proposal.id, 'proposal_auto_hidden', '開催決定がないため、候補日時の3日前に企画を公開一覧から除外しました。候補日時を更新して再掲載できます。', `auto-hidden:${proposal.id}:${jstDateKey(proposal.tentative_starts_at)}`]);
      autoHidden += 1;
    }

    const reminderRows = await client.query(`select * from proposals where status = 'published' and event_status <> 'confirmed' and ${DAYS_UNTIL} between 4 and 7`);
    for (const proposal of reminderRows.rows) {
      const inserted = await client.query('insert into notifications (recipient_id, proposal_id, kind, body, dedupe_key) values ($1, $2, $3, $4, $5) on conflict (dedupe_key) do nothing returning id', [proposal.owner_id, proposal.id, 'proposal_confirmation_reminder', '開催候補日の1週間前です。開催決定になっていないため、内容を確認してください。', `reminder:${proposal.id}:${jstDateKey(proposal.tentative_starts_at)}`]);
      reminded += inserted.rowCount ?? 0;
    }
    await client.query('commit');
  } catch {
    try {
      await client.query('rollback');
    } catch {
      // rollback に失敗したコネクションはトランザクションが開いたまま残りうる。
      broken = true;
    }
    return NextResponse.json({ error: 'deadline_processing_failed' }, { status: 500 });
  } finally {
    client.release(broken);
  }

  // 期限切れの回数制限カウンタを掃除する。判定はウィンドウ単位で行を分けている
  // ので、掃除が失敗しても制限そのものは正しく効き続ける。処理は分離しておく。
  let prunedRateLimits = 0;
  try {
    prunedRateLimits = await pruneRateLimits();
  } catch (error) {
    console.error('AIueo rate limit pruning failed', error);
  }

  return NextResponse.json({ ok: true, expired, autoHidden, reminded, prunedRateLimits });
}
