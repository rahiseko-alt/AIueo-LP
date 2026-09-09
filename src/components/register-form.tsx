'use client';

import { useEffect, useState } from 'react';
import { createAuthClient } from '@neondatabase/auth/next';

/**
 * 画面に出す一言。
 *
 * 失敗は `role="alert"`、成功・案内は `role="status"` にする。読み上げの
 * 扱いが違うため、同じ役割にすると失敗が読み飛ばされる。
 */
type Notice = { kind: 'error' | 'info'; text: string } | null;

/**
 * 原因が特定できないときの文言。
 *
 * 「電波を確認して」と言い切らない。サーバー側の設定不備でもここに来るため、
 * 利用者のせいにする文になってしまう（実際に認証未設定の環境で 503 が返ると
 * この経路に入ることを実測で確認した）。
 */
const NETWORK_MESSAGE = 'ログインを開始できませんでした。少し時間をおいて、もう一度お試しください。繰り返す場合は、電波の状況をご確認のうえお問い合わせください。';

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

  // Google 側で中断・失敗したときは `?auth_error=1` を付けてここへ戻す。
  // 何が起きたか分からないまま同じ画面に戻ると、利用者は操作を繰り返すしかない。
  //
  // 初期値をURLから決めるとサーバー側の描画と食い違うため、描画が落ち着いてから
  // 切り替える（effect の中で同期的に setState しない）。
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('auth_error')) return;

    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setNotice({
        kind: 'error',
        text: 'Googleでのログインが完了しませんでした。もう一度お試しください。',
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Google の同意画面へ送り出す。
   *
   * 失敗したときだけ `isWorking` を戻す。成功時に戻してはいけない。
   * SDKは応答を受けたあと非同期に `window.location` を書き換えるため、
   * ここで戻すと画面が切り替わるまでの間ボタンが再び押せてしまい、
   * 二重にログインを開始できる。
   *
   * 例外で抜けた場合も必ず戻す。押せないまま無言で固まるのを防ぐ
   * （2026-09-05 に実際に起きた不具合と同じ形）。
   */
  async function startGoogleSignIn() {
    if (!configured) return;
    setIsWorking(true);
    setNotice(null);
    try {
      // 戻り先は絶対URLで渡す。相対パスだと認証基盤（Neon）のドメインを基準に
      // 解決され、こちらのサイトへ戻ってこない。
      const origin = window.location.origin;
      const { error } = await createAuthClient().signIn.social({
        provider: 'google',
        // 会員登録が未完了なら同意フォーム、完了済みなら登録内容が出る。
        callbackURL: new URL('/member/profile', origin).toString(),
        // 失敗時の戻り先。渡さないと、同意をキャンセルした利用者が
        // 認証基盤側の英語のエラー画面に取り残される。
        errorCallbackURL: new URL('/register?auth_error=1', origin).toString(),
      });
      if (error) {
        setNotice({ kind: 'error', text: withCause('Googleでの認証を開始できませんでした。', error) });
        setIsWorking(false);
        return;
      }
      setNotice({ kind: 'info', text: 'Googleの画面へ移動します。' });
    } catch (cause) {
      setNotice({ kind: 'error', text: withCause(NETWORK_MESSAGE, cause) });
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
