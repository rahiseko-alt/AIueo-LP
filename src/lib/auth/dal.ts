import 'server-only';

import { redirect } from 'next/navigation';
import { neonAuth, isNeonAuthConfigured } from '@/lib/neon/auth';
import { db } from '@/lib/neon/db';

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

  if (!db) return { kind: 'unconfigured' };
  const result = await db.$client.query(
    'select id, role, status, public_name, collaboration_interest from profiles where id = $1 limit 1',
    [userId],
  );
  if (result.rowCount !== 1) return { kind: 'profile_missing', userId };
  return { kind: 'member', userId, profile: result.rows[0] as MemberProfile };
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
