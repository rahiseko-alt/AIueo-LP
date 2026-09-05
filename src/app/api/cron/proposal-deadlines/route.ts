import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/neon/db';
import { pruneRateLimits } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!db) return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });

  const client = await db.$client.connect();
  let expired = 0;
  let autoHidden = 0;
  let reminded = 0;
  try {
    await client.query('begin');
    const expiredRows = await client.query("select * from proposals where status = 'published' and public_expires_at <= now() for update");
    for (const proposal of expiredRows.rows) {
      const updated = await client.query("update proposals set status = 'expired' where id = $1 returning *", [proposal.id]);
      await client.query('insert into proposal_versions (proposal_id, reason_code, reason_text, snapshot) values ($1, $2, $3, $4::jsonb)', [proposal.id, 'public_expiry', '公開期限の到来', JSON.stringify(updated.rows[0])]);
      await client.query('insert into audit_log (entity_type, entity_id, action, before_state, after_state) values ($1, $2, $3, $4::jsonb, $5::jsonb)', ['proposal', proposal.id, 'cron_proposal_expired', JSON.stringify(proposal), JSON.stringify(updated.rows[0])]);
      await client.query('insert into notifications (recipient_id, proposal_id, kind, body, dedupe_key) values ($1, $2, $3, $4, $5) on conflict (dedupe_key) do nothing', [proposal.owner_id, proposal.id, 'proposal_expired', '公開期限を過ぎたため、企画を公開一覧から除外しました。', `expiry:${proposal.id}:${new Date(proposal.public_expires_at).toISOString().slice(0, 10)}`]);
      expired += 1;
    }

    const autoHideRows = await client.query("select * from proposals where status = 'published' and event_status <> 'confirmed' and tentative_starts_at > now() and tentative_starts_at <= now() + interval '3 days' for update");
    for (const proposal of autoHideRows.rows) {
      const updated = await client.query("update proposals set status = 'auto_hidden' where id = $1 returning *", [proposal.id]);
      await client.query('insert into proposal_versions (proposal_id, reason_code, reason_text, snapshot) values ($1, $2, $3, $4::jsonb)', [proposal.id, 'unconfirmed_three_days_before', '候補日時の3日前までに開催決定なし', JSON.stringify(updated.rows[0])]);
      await client.query('insert into audit_log (entity_type, entity_id, action, before_state, after_state) values ($1, $2, $3, $4::jsonb, $5::jsonb)', ['proposal', proposal.id, 'cron_proposal_auto_hidden', JSON.stringify(proposal), JSON.stringify(updated.rows[0])]);
      await client.query('insert into notifications (recipient_id, proposal_id, kind, body, dedupe_key) values ($1, $2, $3, $4, $5) on conflict (dedupe_key) do nothing', [proposal.owner_id, proposal.id, 'proposal_auto_hidden', '開催決定がないため、候補日時の3日前に企画を公開一覧から除外しました。候補日時を更新して再掲載できます。', `auto-hidden:${proposal.id}:${new Date(proposal.tentative_starts_at).toISOString().slice(0, 10)}`]);
      autoHidden += 1;
    }

    const reminderRows = await client.query("select * from proposals where status = 'published' and event_status <> 'confirmed' and tentative_starts_at > now() + interval '3 days' and tentative_starts_at <= now() + interval '7 days'");
    for (const proposal of reminderRows.rows) {
      const inserted = await client.query('insert into notifications (recipient_id, proposal_id, kind, body, dedupe_key) values ($1, $2, $3, $4, $5) on conflict (dedupe_key) do nothing returning id', [proposal.owner_id, proposal.id, 'proposal_confirmation_reminder', '開催候補日の1週間前です。開催決定になっていないため、内容を確認してください。', `reminder:${proposal.id}:${new Date(proposal.tentative_starts_at).toISOString().slice(0, 10)}`]);
      reminded += inserted.rowCount ?? 0;
    }
    await client.query('commit');
  } catch {
    await client.query('rollback');
    return NextResponse.json({ error: 'deadline_processing_failed' }, { status: 500 });
  } finally {
    client.release();
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
