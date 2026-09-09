'use client';

import { useState } from 'react';
import { createAuthClient } from '@neondatabase/auth/next';

/**
 * 画面に出す一言。
 *
 * 失敗は `role="alert"`、成功・案内は `role="status"` にする。読み上げの
 * 扱いが違うため、同じ役割にすると失敗が読み飛ばされる。
 */
type Notice = { kind: 'error' | 'info'; text: string } | null;

const NETWORK_MESSAGE = '通信できませんでした。電波の状況を確認して、もう一度お試しください。';

/**
 * 例外や失敗応答から、画面に出せる一言を作る。
 *
 * 原因が分からないまま止まるのが一番困るので、判明している原因は括弧で添える。
 * ここに出るのは認証基盤が返す定型文で、個人の登録有無を明かすものは含まれない。
 */
function withCause(base: string, cause: unknown) {
  const message =
    cause && typeof cause === 'object' && 'message' in cause && typeof (cause as { message?: unknown }).message === 'string'
      ? (cause as { message: string }).message.trim()
      : '';
  return message ? `${base}（${message}）` : base;
}

export function RegisterForm() {
  const configured = Boolean(process.env.NEXT_PUBLIC_NEON_AUTH_ENABLED === 'true');
  const [notice, setNotice] = useState<Notice>(null);
  const [isWorking, setIsWorking] = useState(false);

  /**
   * Google の同意画面へ送り出す。
   *
   * 成功した場合はこのページから離れるので、`isWorking` を戻す処理は
   * 実質的に失敗時のためのものになる。それでも `finally` に置くのは、
   * 例外で抜けたときにボタンが押せないまま無言で固まるのを防ぐためである
   * （2026-09-05 に実際に起きた不具合と同じ形）。
   */
  async function startGoogleSignIn() {
    if (!configured) return;
    setIsWorking(true);
    setNotice(null);
    try {
      const { error } = await createAuthClient().signIn.social({
        provider: 'google',
        // 戻り先。会員登録が未完了なら同意フォーム、完了済みなら登録内容が出る。
        callbackURL: '/member/profile',
      });
      if (error) {
        setNotice({ kind: 'error', text: withCause('Googleでの認証を開始できませんでした。', error) });
        return;
      }
      setNotice({ kind: 'info', text: 'Googleの画面へ移動します。' });
    } catch (cause) {
      setNotice({ kind: 'error', text: withCause(NETWORK_MESSAGE, cause) });
    } finally {
      setIsWorking(false);
    }
  }

  return <div className="mt-8 space-y-5">
    {!configured && <p className="border border-[#c8a45a]/45 bg-[#c8a45a]/10 p-4 text-sm leading-7 text-[rgba(240,237,232,0.8)]">会員認証の接続を準備中です。公開前のため、現在は登録を開始できません。</p>}
    <button
      type="button"
      disabled={!configured || isWorking}
      onClick={startGoogleSignIn}
      className="btn-solid w-full disabled:cursor-not-allowed disabled:opacity-45"
    >Googleで続ける</button>
    <p className="text-sm leading-7 text-[rgba(240,237,232,0.72)]">初めての方も、すでに登録済みの方も、同じボタンから入れます。AIueoはパスワードを預かりません。</p>
    {notice && <p
      role={notice.kind === 'error' ? 'alert' : 'status'}
      className={`text-sm leading-7 ${notice.kind === 'error' ? 'border border-[#e0796a]/60 bg-[#e0796a]/10 p-4 text-[#f4c8c0]' : 'text-[#d7bd82]'}`}
    >{notice.text}</p>}
  </div>;
}
