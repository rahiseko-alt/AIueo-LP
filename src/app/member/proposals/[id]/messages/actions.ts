'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireActiveMember } from '@/lib/auth/dal';
import { db } from '@/lib/neon/db';

export async function sendMemberMessageAction(formData: FormData) {
  if (!db) return;
  const proposalId = formData.get('proposalId');
  const body = z.string().trim().min(1).max(5000).safeParse(formData.get('body'));
  if (typeof proposalId !== 'string' || !body.success) return;
  const member = await requireActiveMember();
  const client = await db.$client.connect();
  try {
    await client.query('begin');
    const proposal = await client.query('select id from proposals where id = $1 and owner_id = $2 for update', [proposalId, member.userId]);
    if (proposal.rowCount !== 1) {
      await client.query('rollback');
      return;
    }
    const message = await client.query('insert into proposal_messages (proposal_id, sender_id, body) values ($1, $2, $3) returning id', [proposalId, member.userId, body.data]);
    const admins = await client.query("select id from profiles where role = 'admin' and status = 'active'");
    for (const admin of admins.rows as Array<{ id: string }>) {
      await client.query('insert into notifications (recipient_id, proposal_id, kind, body, dedupe_key) values ($1, $2, $3, $4, $5)', [admin.id, proposalId, 'member_message', '企画者からメッセージが届きました。', `member-message-${message.rows[0].id}-${admin.id}`]);
    }
    await client.query('insert into audit_log (actor_id, entity_type, entity_id, action, after_state) values ($1, $2, $3, $4, $5::jsonb)', [member.userId, 'proposal_message', message.rows[0].id, 'member_message_sent', JSON.stringify({ proposalId })]);
    await client.query('commit');
  } catch {
    await client.query('rollback');
    return;
  } finally {
    client.release();
  }
  redirect(`/member/proposals/${proposalId}/messages`);
}
