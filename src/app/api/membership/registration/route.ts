import { ipAddress } from '@vercel/functions';
import { NextRequest, NextResponse } from 'next/server';
import { neonAuth } from '@/lib/neon/auth';
import { consumeRateLimit } from '@/lib/rate-limit';

type RegistrationRequest = {
  action?: 'signup' | 'resend';
  email?: unknown;
  password?: unknown;
};

// アドレス単位とIP単位の両方で絞る。アドレス単位は1つの宛先へのメール爆撃を、
// IP単位は多数のアドレスを試す列挙と、上流の共有枠の食い潰しを防ぐ。
const PER_EMAIL = { scope: 'registration:email', windowSeconds: 3600, max: 3 };
const PER_IP = { scope: 'registration:ip', windowSeconds: 3600, max: 10 };

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  return origin === request.nextUrl.origin;
}

/**
 * 送信元IP。まずプラットフォームが付ける値（`ipAddress`）を使う。これは
 * Vercel 側が上書きするので、呼び出し元が申告した値ではない。取れない環境
 * のために x-forwarded-for を残すが、順序を逆にすると申告値を優先すること
 * になり、攻撃者がヘッダを変えるだけで枠をリセットできる。
 * どれも取れない場合は 'unknown' の共有枠に落とす。素通しにはしない。
 */
function clientIp(request: NextRequest) {
  return ipAddress(request) || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

function tooManyRequests(retryAfterSeconds: number) {
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return NextResponse.json(
    { ok: false, message: `送信回数の上限に達しました。約${minutes}分後にもう一度お試しください。` },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
  );
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

  // 認証基盤を叩く前に消費する。上流の共有枠を守るのが目的なので、
  // 上流へ要求を出してからでは遅い。
  const ipLimit = await consumeRateLimit(clientIp(request), PER_IP);
  if (!ipLimit.allowed) return tooManyRequests(ipLimit.retryAfterSeconds);

  const emailLimit = await consumeRateLimit(email, PER_EMAIL);
  if (!emailLimit.allowed) return tooManyRequests(emailLimit.retryAfterSeconds);

  if (body.action === 'signup') {
    const { error } = await neonAuth.signUp.email({ email, password, name: 'AIueo member' });
    if (error) {
      const code = (error as { code?: string }).code;
      // 既存アドレスでも失敗として扱わない。確認コードを送って同じ応答を返すことで、
      // 登録済みかどうかを呼び出し側から判別できないようにする。
      if (code !== 'USER_ALREADY_EXISTS') return failed('signup', error);
    }
  }

  const { error } = await neonAuth.emailOtp.sendVerificationOtp({ email, type: 'email-verification' });
  if (error) return failed('delivery', error);

  // 応答は常に同一。あるアドレスが会員かどうかを外部に漏らさない。
  return NextResponse.json({ ok: true });
}
