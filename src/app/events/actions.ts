'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';

export async function createReportAction(formData: FormData) {
  if (!isSupabaseConfigured()) return;
  const id = formData.get('proposalId'); const slug = formData.get('slug'); const category = z.string().trim().min(1).max(80).safeParse(formData.get('category')); const details = z.string().trim().min(1).max(3000).safeParse(formData.get('details'));
  if (typeof id !== 'string' || typeof slug !== 'string' || !category.success || !details.success) return;
  const supabase = await createSupabaseServerClient(); await supabase.rpc('create_report', { p_proposal_id: id, p_category: category.data, p_details: details.data }); redirect(`/events/${slug}?reported=1`);
}
