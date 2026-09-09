import { test, expect } from '@playwright/test';
import { isOAuthReturn, OAUTH_VERIFIER_PARAM, OAUTH_CHALLENGE_COOKIES } from '../src/lib/auth/oauth-return';

/**
 * `src/proxy.ts` の分岐。
 *
 * Google から戻ってきた1リクエストだけは認証SDKのmiddlewareへ委譲し、
 * それ以外は素通しにする。この線引きが崩れる壊れ方は2通りあり、
 * どちらも画面には黙って現れる。
 *
 * 1. 全リクエストを委譲してしまう → SDK の除外リストは固定で差し替えられないため、
 *    `/` や `/events` など公開ページが軒並みログイン必須になる。
 * 2. 条件を厳しくしすぎて委譲されない → Google から戻ってもセッションが確定せず、
 *    「押しても未ログインのまま」に戻る。
 *
 * ブラウザ越しの検証には限界がある。ローカルとCIには認証情報が無く middleware が
 * 無効化されるため、「素通し」と「委譲したが何も起きなかった」を画面から区別できない。
 * そこで判定条件そのものを純粋な関数へ切り出し、真理値表を直接固定する。
 * middleware を挟んだ実挙動（2 の側）は実アカウントが要るため、人が本番で確認する
 * （`HANDOFF.md` の手動確認手順）。
 */

test.describe('OAuth戻りの判定条件', () => {
  const withCookie = (present: string[]) => (name: string) => present.includes(name);

  test('パラメータとCookieが揃ったときだけ真になる', () => {
    const params = new URLSearchParams(`${OAUTH_VERIFIER_PARAM}=token`);

    expect(isOAuthReturn(params, withCookie([OAUTH_CHALLENGE_COOKIES[0]])), 'OAuth戻りを取りこぼしている').toBe(true);
    expect(isOAuthReturn(params, withCookie([OAUTH_CHALLENGE_COOKIES[1]])), 'SDKに残る旧綴りを見ていない').toBe(true);
  });

  test('パラメータだけでは真にならない', () => {
    const params = new URLSearchParams(`${OAUTH_VERIFIER_PARAM}=token`);

    expect(isOAuthReturn(params, withCookie([])), 'URLを打つだけで認証経路へ引き込める').toBe(false);
  });

  test('Cookieだけでは真にならない', () => {
    expect(
      isOAuthReturn(new URLSearchParams(''), withCookie([OAUTH_CHALLENGE_COOKIES[0]])),
      'Cookieが残っている間ずっと委譲してしまう',
    ).toBe(false);
  });

  test('SDKが使う名前から変えていない', () => {
    // ここが SDK 内部の定数とずれると Google ログインが黙って壊れる。
    expect(OAUTH_VERIFIER_PARAM).toBe('neon_auth_session_verifier');
    expect([...OAUTH_CHALLENGE_COOKIES]).toEqual([
      '__Secure-neon-auth.session_challenge',
      '__Secure-neon-auth.session_challange',
    ]);
  });
});

const PUBLIC_PATHS = ['/', '/events', '/terms', '/register'];

for (const path of PUBLIC_PATHS) {
  test(`${path} は素通しのまま（認証を要求しない）`, async ({ page }) => {
    const response = await page.goto(path);

    expect(response?.status(), `${path} が認証で弾かれている`).toBe(200);
    expect(new URL(page.url()).pathname, `${path} からログイン画面へ飛ばされている`).toBe(path);
  });
}

test('検証パラメータだけ付いていても、Cookieが無ければ素通しする', async ({ page }) => {
  // OAuth の戻りは「パラメータ」と「challenge Cookie」が揃って初めて成立する。
  // パラメータだけで委譲すると、URLを打つだけで公開ページの挙動を変えられる。
  const response = await page.goto('/?neon_auth_session_verifier=not-a-real-token');

  expect(response?.status(), '検証パラメータだけで挙動が変わっている').toBe(200);
  expect(new URL(page.url()).pathname).toBe('/');
});
