import { type NextRequest, NextResponse } from 'next/server';
import { refreshSupabaseSession } from '@/lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  // This only refreshes Supabase cookies. Every protected page, action, and
  // route handler must independently verify claims and the database profile.
  try {
    return await refreshSupabaseSession(request);
  } catch {
    // Public pages remain available while infrastructure is being configured.
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
