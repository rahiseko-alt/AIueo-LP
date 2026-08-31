import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';

function safeNext(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/member/profile';
}

export async function GET(request: NextRequest) {
  const next = safeNext(request.nextUrl.searchParams.get('next'));
  const code = request.nextUrl.searchParams.get('code');

  if (!isSupabaseConfigured() || !code) {
    return NextResponse.redirect(new URL('/register?error=auth', request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL(error ? '/register?error=auth' : next, request.url));
}
