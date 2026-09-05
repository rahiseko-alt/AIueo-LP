'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/neon/db';
import { getAuthContext } from '@/lib/auth/dal';

export async function createReportAction(formData: FormData) {
  if (!db) return;
  const id = formData.get('proposalId'); const slug = formData.get('slug'); const category = z.string().trim().min(1).max(80).safeParse(formData.get('category')); const details = z.string().trim().min(1).max(3000).safeParse(formData.get('details'));
  if (typeof id !== 'string' || typeof slug !== 'string' || !category.success || !details.success) return;
  const context = await getAuthContext();
  const reporterId = context.kind === 'member' ? context.userId : null;
  const client = await db.$client.connect();
  let broken = false;
  try {
    await client.query('begin');
    const proposal = await client.query(
      "select id from proposals where id = $1 and slug = $2 and status = 'published' and visibility = 'public' and public_expires_at > now()",
      [id, slug],
    );
    if (proposal.rowCount !== 1) {
      await client.query('rollback');
      return;
    }
    const report = await client.query(
      'insert into reports (proposal_id, reporter_id, category, details) values ($1, $2, $3, $4) returning id',
      [id, reporterId, category.data, details.data],
    );
    await client.query(
      'insert into audit_log (actor_id, entity_type, entity_id, action, after_state) values ($1, $2, $3, $4, $5::jsonb)',
      [reporterId, 'report', report.rows[0].id, 'report_created', JSON.stringify({ proposalId: id, category: category.data })],
    );
    await client.query('commit');
  } catch {
    try {
      await client.query('rollback');
    } catch {
      // rollback に失敗したコネクションはトランザクションが開いたまま残りうる。
      broken = true;
    }
    return;
  } finally {
    client.release(broken);
  }
  redirect(`/events/${slug}?reported=1`);
}
