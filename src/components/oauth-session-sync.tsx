'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAuthClient } from '@neondatabase/auth/next';
import { OAUTH_VERIFIER_PARAM } from '@/lib/auth/oauth-return';

/**
 * Google から戻ってきた直後に、セッションをこちらのドメインへ確定させる。
 *
 * Neon Auth の OAuth は Neon 側の callback を経由して戻るため、戻ってきた時点では
 * こちらのドメインにセッションCookieが無い。URLに付く `neon_auth_session_verifier`
 * を上流へ渡して初めてCookieが載る。
 *
 * その受け渡しは認証SDKのクライアントが `getSession()` の中で行う。パラメータが
 * 付いていればキャッシュを避けて `/api/auth/get-session` へ転送し、成功したら
 * アドレスバーからパラメータを消す（`adapter-core-*.mjs` の `getSession` フック）。
 * ここでやるのは「戻ってきた直後に一度 `getSession()` を呼び、サーバー側の描画を
 * やり直す」ことだけである。
 *
 * middleware でやらない理由は `src/proxy.ts` のコメントを参照。
 */
export function OAuthSessionSync() {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'working' | 'failed'>('idle');

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has(OAUTH_VERIFIER_PARAM)) return;

    let cancelled = false;

    // 初期値をURLから決めるとサーバー側の描画と食い違うため、状態の切り替えは
    // 描画が落ち着いてから行う（effect の中で同期的に setState しない）。
    (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setState('working');
      try {
        await createAuthClient().getSession();
        if (cancelled) return;
        // サーバーコンポーネントは未ログインとして描画済みなので、引き直す。
        router.refresh();
      } catch {
        // 原因が分からないまま白い画面で止まるのが一番困る。やり直せる導線を出す。
        if (!cancelled) setState('failed');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (state === 'idle') return null;

  if (state === 'failed') {
    return <p role="alert" className="mb-6 border border-[#e0796a]/60 bg-[#e0796a]/10 p-4 text-sm leading-7 text-[#f4c8c0]">
      ログイン状態を確定できませんでした。<a className="underline hover:text-white" href="/register">もう一度お試しください</a>。繰り返す場合は<a className="underline hover:text-white" href="/contact">お問い合わせ</a>ください。
    </p>;
  }

  return <p role="status" className="mb-6 border border-[#c8a45a]/45 bg-[#c8a45a]/10 p-4 text-sm leading-7 text-[rgba(240,237,232,0.8)]">ログイン処理をしています。少しお待ちください。</p>;
}
