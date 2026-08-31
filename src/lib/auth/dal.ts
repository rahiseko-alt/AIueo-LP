import 'server-only';

import { redirect } from 'next/navigation';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type MemberProfile = {
  id: string;
  role: 'member' | 'admin';
  status: 'pending_profile' | 'active' | 'suspended' | 'withdrawn';
  public_name: string | null;
  collaboration_interest: string | null;
};

export type AuthContext =
  | { kind: 'unconfigured' }
  | { kind: 'signed_out' }
  | { kind: 'profile_missing'; userId: string }
  | { kind: 'member'; userId: string; profile: MemberProfile };

export async function getAuthContext(): Promise<AuthContext> {
  if (!isSupabaseConfigured()) {
    return { kind: 'unconfigured' };
  }

  const supabase = await createSupabaseServerClient();
  const { data: claimData, error: claimsError } = await supabase.auth.getClaims();
  const userId = typeof claimData?.claims?.sub === 'string' ? claimData.claims.sub : null;

  if (claimsError || !userId) {
    return { kind: 'signed_out' };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, status, public_name, collaboration_interest')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return { kind: 'profile_missing', userId };
  }

  return { kind: 'member', userId, profile: data as MemberProfile };
}

export async function requireActiveMember() {
  const context = await getAuthContext();

  if (context.kind !== 'member' || context.profile.status !== 'active') {
    redirect('/register?next=/member');
  }

  return context;
}

export async function requireAdmin() {
  const context = await getAuthContext();

  if (
    context.kind !== 'member' ||
    context.profile.status !== 'active' ||
    context.profile.role !== 'admin'
  ) {
    redirect('/');
  }

  return context;
}
