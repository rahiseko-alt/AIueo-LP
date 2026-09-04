'use client';

import { FormEvent, useState } from 'react';
import { createAuthClient } from '@neondatabase/auth/next';

type Screen = 'credentials' | 'verify';

export function RegisterForm() {
  const configured = Boolean(process.env.NEXT_PUBLIC_NEON_AUTH_ENABLED === 'true');
  const [screen, setScreen] = useState<Screen>('credentials');
  const [intent, setIntent] = useState<'signup' | 'signin'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  async function sendVerificationCode() {
    if (!configured || !email) return false;
    const response = await fetch('/api/membership/registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resend', email }),
    });
    const result = await response.json().catch(() => null) as { ok?: boolean; message?: string } | null;
    if (!response.ok || !result?.ok) {
      setNotice(result?.message ?? '確認コードを送信できませんでした。時間をおいて再送してください。');
      return false;
    }
    setNotice('確認コードを送信しました。メールの受信トレイと迷惑メールを確認してください。');
    return true;
  }

  async function submitCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured || !email || password.length < 8) return;
    setIsWorking(true); setNotice(null);
    if (intent === 'signin') {
      const { error } = await createAuthClient().signIn.email({ email, password });
      if (error) { setNotice(`ログインできませんでした: ${error.message}`); setIsWorking(false); return; }
      window.location.assign('/member/profile'); return;
    }
    const response = await fetch('/api/membership/registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'signup', email, password }),
    });
    const result = await response.json().catch(() => null) as { ok?: boolean; message?: string } | null;
    if (!response.ok || !result?.ok) {
      setNotice(result?.message ?? '登録を開始できませんでした。時間をおいて再度お試しください。');
      setIsWorking(false);
      return;
    }
    setScreen('verify');
    // 登録済みかどうかで文言を変えない。変えると、任意のアドレスが会員かを
    // 画面から判別できてしまう。
    setNotice('このアドレスが利用できる場合、確認コードを送信しました。メールの受信トレイと迷惑メールを確認してください。');
    setIsWorking(false);
  }

  async function verifyEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured || !email || !code) return;
    setIsWorking(true); setNotice(null);
    const { error } = await createAuthClient().emailOtp.verifyEmail({ email, otp: code });
    if (error) { setNotice(`確認できませんでした: ${error.message}`); setIsWorking(false); return; }
    window.location.assign('/member/profile');
  }

  async function resendVerificationCode() {
    setIsWorking(true);
    setNotice(null);
    await sendVerificationCode();
    setIsWorking(false);
  }

  return <div className="mt-8 space-y-5">
    {!configured && <p className="border border-[#c8a45a]/45 bg-[#c8a45a]/10 p-4 text-sm leading-7 text-[rgba(240,237,232,0.8)]">会員認証の接続を準備中です。公開前のため、現在は登録を開始できません。</p>}
    {screen === 'credentials' ? <>
      <form onSubmit={submitCredentials} className="space-y-4">
        <label className="block font-mono text-xs tracking-[0.1em] text-[rgba(240,237,232,0.72)]" htmlFor="register-email">メールアドレス</label>
        <input id="register-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="min-h-11 w-full border border-white/20 bg-black/20 px-3 text-base outline-none transition-colors placeholder:text-white/35 focus:border-[#c8a45a]" />
        <label className="block font-mono text-xs tracking-[0.1em] text-[rgba(240,237,232,0.72)]" htmlFor="register-password">パスワード（8文字以上）</label>
        <input id="register-password" type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-11 w-full border border-white/20 bg-black/20 px-3 text-base outline-none transition-colors focus:border-[#c8a45a]" />
        <button type="submit" disabled={!configured || isWorking} className="btn-ghost w-full disabled:cursor-not-allowed disabled:opacity-45">{intent === 'signup' ? 'メールで登録する' : 'メールでログインする'}</button>
      </form>
      <button type="button" disabled={!configured || isWorking} onClick={() => { setIntent(intent === 'signup' ? 'signin' : 'signup'); setNotice(null); }} className="min-h-11 text-sm text-[#d7bd82] underline disabled:opacity-45">{intent === 'signup' ? 'すでに登録済みの方はこちら' : '初めて登録する方はこちら'}</button>
    </> : <form onSubmit={verifyEmail} className="space-y-4">
      <p className="text-sm leading-7 text-white/75"><span className="font-mono text-[#d7bd82]">{email}</span> に届いた確認コードを入力してください。</p>
      <label className="block font-mono text-xs tracking-[0.1em] text-[rgba(240,237,232,0.72)]" htmlFor="register-code">確認コード</label>
      <input id="register-code" type="text" inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={(event) => setCode(event.target.value)} className="min-h-11 w-full border border-white/20 bg-black/20 px-3 font-mono text-lg tracking-[0.2em] outline-none transition-colors focus:border-[#c8a45a]" />
      <button type="submit" disabled={!configured || isWorking} className="btn-solid w-full disabled:cursor-not-allowed disabled:opacity-45">メールアドレスを確認する</button>
      <button type="button" disabled={!configured || isWorking} onClick={resendVerificationCode} className="min-h-11 text-sm text-[#d7bd82] underline disabled:opacity-45">確認コードを再送する</button>
      <button type="button" disabled={isWorking} onClick={() => { setScreen('credentials'); setCode(''); setNotice(null); }} className="min-h-11 text-sm text-[#d7bd82] underline">戻る</button>
    </form>}
    {notice && <p role="status" className="text-sm leading-7 text-[#d7bd82]">{notice}</p>}
  </div>;
}
