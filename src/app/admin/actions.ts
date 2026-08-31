'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';

const statusSchema = z.enum(['draft', 'submitted', 'published', 'needs_revision', 'auto_hidden', 'hidden', 'ended', 'cancelled', 'expired']);
const memberStatusSchema = z.enum(['active', 'suspended', 'withdrawn']);
const reasonSchema = z.object({ reasonCode: z.string().trim().min(1).max(80), reasonText: z.string().trim().min(1).max(2000) });

export async function adminSetProposalStateAction(formData: FormData) {
  if (!isSupabaseConfigured()) return;
  const proposalId = formData.get('proposalId'); const status = statusSchema.safeParse(formData.get('status')); const reason = reasonSchema.safeParse({ reasonCode: formData.get('reasonCode'), reasonText: formData.get('reasonText') });
  if (typeof proposalId !== 'string' || !status.success || !reason.success) return;
  const supabase = await createSupabaseServerClient();
  await supabase.rpc('admin_set_proposal_state', { p_proposal_id: proposalId, p_status: status.data, p_reason_code: reason.data.reasonCode, p_reason_text: reason.data.reasonText });
  redirect(`/admin/proposals/${proposalId}`);
}

export async function adminSetMemberStatusAction(formData: FormData) {
  if (!isSupabaseConfigured()) return;
  const userId = formData.get('userId'); const status = memberStatusSchema.safeParse(formData.get('status')); const reason = reasonSchema.safeParse({ reasonCode: formData.get('reasonCode'), reasonText: formData.get('reasonText') });
  if (typeof userId !== 'string' || !status.success || !reason.success) return;
  const supabase = await createSupabaseServerClient();
  await supabase.rpc('admin_set_member_status', { p_user_id: userId, p_status: status.data, p_reason_code: reason.data.reasonCode, p_reason_text: reason.data.reasonText });
  redirect('/admin/members');
}

export async function adminResolveReportAction(formData: FormData) {
  if (!isSupabaseConfigured()) return;
  const reportId = formData.get('reportId'); const reason = reasonSchema.safeParse({ reasonCode: formData.get('reasonCode'), reasonText: formData.get('reasonText') });
  if (typeof reportId !== 'string' || !reason.success) return;
  const supabase = await createSupabaseServerClient();
  await supabase.rpc('admin_resolve_report', { p_report_id: reportId, p_reason_code: reason.data.reasonCode, p_reason_text: reason.data.reasonText });
  redirect('/admin/moderation');
}

export async function sendAdminMessageAction(formData: FormData) {
  if (!isSupabaseConfigured()) return;
  const proposalId = formData.get('proposalId'); const body = z.string().trim().min(1).max(5000).safeParse(formData.get('body'));
  if (typeof proposalId !== 'string' || !body.success) return;
  const supabase = await createSupabaseServerClient();
  await supabase.rpc('send_proposal_message', { p_proposal_id: proposalId, p_body: body.data });
  redirect(`/admin/proposals/${proposalId}/messages`);
}

const editSchema = z.object({ proposalId: z.string().uuid(), title: z.string().trim().min(1).max(140), summary: z.string().trim().min(1).max(5000), format: z.string().trim().min(1).max(120), tentativeStartsAt: z.string().min(1), recruitmentDeadlineAt: z.string(), publicExpiresAt: z.string().min(1), organizerName: z.string().trim().min(1).max(120), participationMethod: z.string().trim().min(1).max(2000), visibility: z.enum(['public', 'unlisted']), moneyType: z.string().min(1), moneyDetails: z.string(), reasonCode: z.string().trim().min(1).max(80), reasonText: z.string().trim().min(1).max(2000) });
function toIso(value: string) { const date = new Date(value.includes('T') && !/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? `${value}:00+09:00` : value); return Number.isNaN(date.valueOf()) ? null : date.toISOString(); }

export async function adminUpdateProposalAction(formData: FormData) {
  if (!isSupabaseConfigured()) return;
  const parsed = editSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return;
  const value = parsed.data; const tentative = toIso(value.tentativeStartsAt); const expiry = toIso(value.publicExpiresAt); const deadline = value.recruitmentDeadlineAt ? toIso(value.recruitmentDeadlineAt) : null;
  if (!tentative || !expiry) return;
  let moneyDetails: unknown = {}; try { moneyDetails = JSON.parse(value.moneyDetails || '{}'); } catch { return; }
  const supabase = await createSupabaseServerClient();
  await supabase.rpc('admin_update_proposal', { p_proposal_id: value.proposalId, p_payload: { title: value.title, summary: value.summary, format: value.format, tentative_starts_at: tentative, recruitment_deadline_at: deadline, public_expires_at: expiry, organizer_name: value.organizerName, participation_method: value.participationMethod, visibility: value.visibility, money_type: value.moneyType, money_details: moneyDetails, publishing_declarations: { prohibited_confirmed: true, rights_confirmed: true, money_confirmed: true } }, p_reason_code: value.reasonCode, p_reason_text: value.reasonText });
  redirect(`/admin/proposals/${value.proposalId}`);
}
