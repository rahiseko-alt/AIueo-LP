import { test, expect } from '@playwright/test';

/**
 * 上流 Neon Auth への Proxy（`/api/auth/[...path]`）の通過範囲。
 *
 * 素の再エクスポートに戻すと、受け取ったパスがそのまま上流へ連結される。
 * そのとき起きることは2つある。
 *
 * 1. 登録と確認コード送信を直接叩けるようになり、`/api/membership/registration`
 *    の回数制限と、登録済みかどうかを漏らさない同一応答を迂回できる。
 * 2. 上流の管理API（利用者一覧・ロール変更・なりすまし）が自ドメイン配下に出る。
 *    通ってしまえば、このアプリの `audit_log` には何も残らない。
 *
 * 許可判定は認証基盤の設定より先に行うので、環境変数が無い環境でも
 * 「塞いでいるか」は判定できる。塞いだパスは 404、通すパスは 404 以外になる。
 */

const BLOCKED = [
  // 回数制限とユーザー列挙対策を迂回できる2本
  'sign-up/email',
  'email-otp/send-verification-otp',
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

test('許可したパスは塞がれていない', async ({ request }) => {
  // 認証基盤が未設定の環境では 503 になる。ここで確かめるのは
  // 「許可リストから漏れて 404 になっていないこと」だけ。
  const res = await request.post('/api/auth/sign-in/email', {
    headers: { 'Content-Type': 'application/json' },
    data: { email: 'someone@example.com', password: 'password1234' },
  });

  expect(res.status(), 'ログイン経路まで塞いでいる').not.toBe(404);
});

test('許可したパスでもメソッドが違えば通さない', async ({ request }) => {
  const res = await request.get('/api/auth/sign-in/email');

  expect(res.status(), 'メソッドを見ずに通している').toBe(404);
});
