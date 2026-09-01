import { NextResponse, type NextRequest } from 'next/server';

function safeNext(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/member/profile';
}

export async function GET(request: NextRequest) {
  const next = safeNext(request.nextUrl.searchParams.get('next'));
  return NextResponse.redirect(new URL(next, request.url));
}
