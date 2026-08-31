'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';

const stateSchema = z.enum(['planning', 'confirmed', 'full', 'cancelled', 'completed']);

export async function setProposalEventStatusAction(formData: FormData) {
  if (!isSupabaseConfigured()) return;
  const proposalId = formData.get('proposalId');
  const eventStatus = stateSchema.safeParse(formData.get('eventStatus'));
  if (typeof proposalId !== 'string' || !eventStatus.success) return;
  const supabase = await createSupabaseServerClient();
  await supabase.rpc('set_proposal_event_status', { p_proposal_id: proposalId, p_event_status: eventStatus.data });
  redirect(`/member/proposals/${proposalId}`);
}
