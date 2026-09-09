import { test, expect } from '@playwright/test';

/**
 * 上流 Neon Auth への Proxy（`/api/auth/[...path]`）の通過範囲。
 *
 * 素の再エクスポートに戻すと、受け取ったパスがそのまま上流へ連結される。
 * そのとき起きることは2つある。
 *
 * 1. 2026-09-09 に廃止したメール認証（登録・ログイン・確認コード）が、Proxy 経由
 *    でだけ生き残る。上流の Neon Auth 側でもメールログインは無効にしてある。
 * 2. 上流の管理API（利用者一覧・ロール変更・なりすまし）が自ドメイン配下に出る。
 *    通ってしまえば、このアプリの `audit_log` には何も残らない。
 *
 * 許可判定は認証基盤の設定より先に行うので、環境変数が無い環境でも
 * 「塞いでいるか」は判定できる。塞いだパスは 404、通すパスは 404 以外になる。
 */

const BLOCKED = [
  // 廃止したメール認証の一式
  'sign-in/email',
  'sign-up/email',
  'email-otp/send-verification-otp',
  'email-otp/verify-email',
  // 上流の管理API
  'admin/list-users',
  'admin/set-role',
  'admin/impersonate-user',
  'admin/ban-user',
  'update-user',
  'delete-user',
];

for (const path of BLOCKED) {
  test(`Proxy は ${path} を通さない`, async ({ request }) => {
    const res = await request.post(`/api/auth/${path}`, {
      headers: { 'Content-Type': 'application/json' },
      data: {},
    });

    expect(res.status(), `${path} が上流へ届いている`).toBe(404);
  });
}

test('許可したパスは塞がれていない', async ({ request, baseURL }) => {
  // 認証基盤が未設定の環境では 503 になる。ここで確かめるのは
  // 「許可リストから漏れて 404 になっていないこと」だけ。
  // これが 404 になると Google ログインがボタンを押した瞬間に失敗する。
  const res = await request.post('/api/auth/sign-in/social', {
    headers: { 'Content-Type': 'application/json', Origin: baseURL ?? '' },
    data: { provider: 'google' },
  });

  expect(res.status(), 'Google ログインの経路まで塞いでいる').not.toBe(404);
  expect(res.status(), '自サイトからの送信を拒否している').not.toBe(403);
});

/**
 * 状態を変える操作を、他サイトから叩けないこと。
 *
 * この Proxy は上流を呼ぶとき Origin を自分で付け直すため、ここで塞がないと
 * 上流側の同一オリジン検証が意味を失う。削除した `/api/membership/registration`
 * が持っていた検証を、残った書き込み経路へ移している。
 */
test('外部サイトからのログイン開始を拒否する', async ({ request }) => {
  const res = await request.post('/api/auth/sign-in/social', {
    headers: { 'Content-Type': 'application/json', Origin: 'https://example.com' },
    data: { provider: 'google' },
  });

  expect(res.status(), '他サイトからログイン開始を叩ける').toBe(403);
});

test('Origin が無い送信を拒否する', async ({ request }) => {
  const res = await request.post('/api/auth/sign-in/social', {
    headers: { 'Content-Type': 'application/json' },
    data: { provider: 'google' },
  });

  expect(res.status(), 'Origin を送らなければ素通しできる').toBe(403);
});

test('許可したパスでもメソッドが違えば通さない', async ({ request }) => {
  const res = await request.get('/api/auth/sign-in/social');

  expect(res.status(), 'メソッドを見ずに通している').toBe(404);
});
