import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const cronSecret = Deno.env.get('CRON_SECRET');
const emailApiKey = Deno.env.get('EMAIL_API_KEY');
const emailFrom = Deno.env.get('EMAIL_FROM') ?? 'noreply@kouheikosehira.com';
const appUrl = Deno.env.get('PUBLIC_APP_URL') ?? 'https://aiueo-lp.vercel.app';

function unauthorized() { return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } }); }

Deno.serve(async (request) => {
  if (request.method !== 'POST' || !cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) return unauthorized();
  if (!supabaseUrl || !serviceRoleKey) return new Response(JSON.stringify({ error: 'function is not configured' }), { status: 503 });
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error: processError } = await supabase.rpc('process_proposal_deadlines');
  if (processError) return new Response(JSON.stringify({ error: 'deadline processing failed' }), { status: 500 });
  const staleBefore = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  await supabase.from('notifications').update({ email_status: 'pending' }).eq('email_status', 'sending').lt('email_last_attempt_at', staleBefore);
  const { data: notifications } = await supabase.from('notifications').select('id, recipient_id, proposal_id, kind, body, email_attempts').eq('email_status', 'pending').lt('email_attempts', 10).order('created_at', { ascending: true }).limit(50);
  let sent = 0; let failed = 0;
  for (const notification of notifications ?? []) {
    const { data: claim } = await supabase.from('notifications').update({ email_status: 'sending', email_last_attempt_at: new Date().toISOString(), email_attempts: notification.email_attempts + 1 }).eq('id', notification.id).eq('email_status', 'pending').select('id').maybeSingle();
    if (!claim) continue;
    const { data: user } = await supabase.auth.admin.getUserById(notification.recipient_id);
    const recipient = user.user?.email;
    if (!emailApiKey || !recipient) { await supabase.from('notifications').update({ email_status: 'failed' }).eq('id', notification.id); failed++; continue; }
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${emailApiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: emailFrom, to: [recipient], subject: 'AIueoからのお知らせ', text: `${notification.body}\n\n詳細: ${appUrl}/member` }) });
    await supabase.from('notifications').update({ email_status: response.ok ? 'sent' : 'failed' }).eq('id', notification.id);
    if (response.ok) sent++; else failed++;
  }
  return new Response(JSON.stringify({ ok: true, sent, failed }), { headers: { 'content-type': 'application/json' } });
});
