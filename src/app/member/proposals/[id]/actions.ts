'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireActiveMember } from '@/lib/auth/dal';
import { db } from '@/lib/neon/db';

const stateSchema = z.enum(['planning', 'confirmed', 'full', 'cancelled', 'completed']);

export async function setProposalEventStatusAction(formData: FormData) {
  if (!db) return;
  const proposalId = formData.get('proposalId');
  const eventStatus = stateSchema.safeParse(formData.get('eventStatus'));
  if (typeof proposalId !== 'string' || !eventStatus.success) return;
  const member = await requireActiveMember();
  const client = await db.$client.connect();
  try {
    await client.query('begin');
    const current = await client.query('select * from proposals where id = $1 and owner_id = $2 for update', [proposalId, member.userId]);
    if (current.rowCount !== 1) {
      await client.query('rollback');
      return;
    }
    const status = eventStatus.data === 'completed' ? 'ended' : eventStatus.data === 'cancelled' ? 'cancelled' : current.rows[0].status;
    const updated = await client.query(
      'update proposals set event_status = $1, status = $2 where id = $3 returning *',
      [eventStatus.data, status, proposalId],
    );
    await client.query(
      'insert into proposal_versions (proposal_id, actor_id, reason_code, snapshot) values ($1, $2, $3, $4::jsonb)',
      [proposalId, member.userId, 'organizer_event_status', JSON.stringify(updated.rows[0])],
    );
    await client.query(
      'insert into audit_log (actor_id, entity_type, entity_id, action, before_state, after_state) values ($1, $2, $3, $4, $5::jsonb, $6::jsonb)',
      [member.userId, 'proposal', proposalId, 'organizer_event_status_changed', JSON.stringify(current.rows[0]), JSON.stringify(updated.rows[0])],
    );
    await client.query('commit');
  } catch {
    await client.query('rollback');
    return;
  } finally {
    client.release();
  }
  redirect(`/member/proposals/${proposalId}`);
}
