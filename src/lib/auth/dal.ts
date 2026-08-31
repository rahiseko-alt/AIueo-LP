import 'server-only';

import { redirect } from 'next/navigation';
import { neonAuth, isNeonAuthConfigured } from '@/lib/neon/auth';

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
  if (!isNeonAuthConfigured || !neonAuth) {
    return { kind: 'unconfigured' };
  }

  const { data: session } = await neonAuth.getSession();
  const userId = session?.user?.id;

  if (!userId) {
    return { kind: 'signed_out' };
  }

  // The profile lookup is introduced with the Neon migration. Until that
  // migration is applied, a signed-in user is intentionally kept out of writes.
  return { kind: 'profile_missing', userId };
}

export async function requireActiveMember() {
  const context = await getAuthContext();

  if (context.kind !== 'member' || context.profile.status !== 'active') {
    redirect('/member/profile');
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
