import { NextRequest, NextResponse } from 'next/server';
import { neonAuth } from '@/lib/neon/auth';

type RegistrationRequest = {
  action?: 'signup' | 'resend';
  email?: unknown;
  password?: unknown;
};

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  return origin === request.nextUrl.origin;
}

function unavailable() {
  return NextResponse.json({ ok: false, message: '会員認証は現在利用できません。時間をおいて再度お試しください。' }, { status: 503 });
}

function failed(step: 'signup' | 'delivery', error: unknown) {
  const details = error as { code?: string; status?: number } | null;
  console.error('AIueo registration request failed', { step, code: details?.code, status: details?.status });
  return NextResponse.json({ ok: false, message: '確認コードを送信できませんでした。時間をおいて再送してください。' }, { status: 502 });
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ ok: false, message: '許可されていない送信元です。' }, { status: 403 });
  if (!neonAuth) return unavailable();

  let body: RegistrationRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: '入力内容を確認してください。' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !email.includes('@')) return NextResponse.json({ ok: false, message: 'メールアドレスを確認してください。' }, { status: 400 });
  if (body.action === 'signup' && password.length < 8) return NextResponse.json({ ok: false, message: 'パスワードは8文字以上で入力してください。' }, { status: 400 });
  if (body.action !== 'signup' && body.action !== 'resend') return NextResponse.json({ ok: false, message: '不正な操作です。' }, { status: 400 });

  let alreadyRegistered = false;
  if (body.action === 'signup') {
    const { error } = await neonAuth.signUp.email({ email, password, name: 'AIueo member' });
    if (error) {
      const code = (error as { code?: string }).code;
      if (code !== 'USER_ALREADY_EXISTS') return failed('signup', error);
      alreadyRegistered = true;
    }
  }

  const { error } = await neonAuth.emailOtp.sendVerificationOtp({ email, type: 'email-verification' });
  if (error) return failed('delivery', error);
  return NextResponse.json({ ok: true, alreadyRegistered });
}
