'use client';

import { FormEvent, useState } from 'react';
import { createAuthClient } from '@neondatabase/auth/next';

export function RegisterForm() {
  const configured = Boolean(process.env.NEXT_PUBLIC_NEON_AUTH_ENABLED === 'true');
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  async function signInWithGoogle() {
    if (!configured) return;
    setIsWorking(true);
    setNotice(null);
    const auth = createAuthClient();
    const { error } = await auth.signIn.social({
      provider: 'google',
      callbackURL: '/member/profile',
    });
    if (error) {
      setNotice(`認証を開始できませんでした: ${error.message}`);
      setIsWorking(false);
    }
  }

  async function sendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured || !email) return;
    setIsWorking(true);
    setNotice(null);
    const auth = createAuthClient();
    const { error } = await auth.signIn.magicLink({ email, callbackURL: '/member/profile' });
    setNotice(error ? `メールを送信できませんでした: ${error.message}` : 'ログイン用リンクを送信しました。メールを開いて登録を続けてください。');
    setIsWorking(false);
  }

  return (
    <div className="mt-8 space-y-5">
      {!configured && (
        <p className="border border-[#c8a45a]/45 bg-[#c8a45a]/10 p-4 text-sm leading-7 text-[rgba(240,237,232,0.8)]">
          会員認証の接続を準備中です。公開前のため、現在は登録を開始できません。
        </p>
      )}
      <button type="button" disabled={!configured || isWorking} onClick={signInWithGoogle} className="btn-solid w-full disabled:cursor-not-allowed disabled:opacity-45">
        Googleで登録・ログイン
      </button>
      <div className="flex items-center gap-3 text-xs text-[rgba(240,237,232,0.45)]"><span className="h-px flex-1 bg-white/10" />または<span className="h-px flex-1 bg-white/10" /></div>
      <form onSubmit={sendMagicLink} className="space-y-3">
        <label className="block font-mono text-xs tracking-[0.1em] text-[rgba(240,237,232,0.72)]" htmlFor="register-email">メールアドレスでログインリンクを受け取る</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input id="register-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="min-h-11 flex-1 border border-white/20 bg-black/20 px-3 text-base outline-none transition-colors placeholder:text-white/35 focus:border-[#c8a45a]" />
          <button type="submit" disabled={!configured || isWorking} className="btn-ghost whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-45">リンクを送る</button>
        </div>
      </form>
      {notice && <p role="status" className="text-sm leading-7 text-[#d7bd82]">{notice}</p>}
    </div>
  );
}
