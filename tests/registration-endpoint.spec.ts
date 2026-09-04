import { test, expect } from '@playwright/test';

/**
 * 会員登録エンドポイントの入口。
 *
 * ここは未認証で叩ける唯一の書き込み経路なので、送信元の検証が外れると
 * 外部サイトから登録・確認メール送信を仕掛けられる。
 *
 * 注意: 認証基盤の環境変数が無い環境では、送信元が一致しても 503 で止まる。
 * このテストが確かめるのは「外部からの送信を拒むこと」であって、
 * 登録が成功することではない。
 */

const ENDPOINT = '/api/membership/registration';

test('外部サイトからの送信を拒否する', async ({ request }) => {
  const res = await request.post(ENDPOINT, {
    headers: { 'Content-Type': 'application/json', Origin: 'https://attacker.example' },
    data: { action: 'signup', email: 'victim@example.com', password: 'password123' },
  });

  expect(res.status(), '外部 Origin からの登録が通っている').toBe(403);
});

test('Origin が無い送信を拒否する', async ({ request }) => {
  const res = await request.post(ENDPOINT, {
    headers: { 'Content-Type': 'application/json' },
    data: { action: 'resend', email: 'victim@example.com' },
  });

  expect(res.status(), 'Origin 無しの送信が通っている').toBe(403);
});

test('登録済みかどうかを応答から判別できない', async ({ request }) => {
  // 修正前は { ok: true, alreadyRegistered: true|false } を返しており、
  // 任意のアドレスが会員かを外部から判定できた。
  //
  // 【このテストの限界】認証基盤の環境変数が無いと成功経路まで到達できないため、
  // ここで確かめられるのはエラー応答に鍵が混じらないことだけ。成功応答に
  // alreadyRegistered が復活しても、この環境では検出できない。
  // 本来の回帰検出には、認証基盤を立てたテスト環境が必要。
  const res = await request.post(ENDPOINT, {
    headers: { 'Content-Type': 'application/json', Origin: 'https://attacker.example' },
    data: { action: 'signup', email: 'victim@example.com', password: 'password123' },
  });

  const body = await res.text();
  expect(body, '応答に登録状態が含まれている').not.toContain('alreadyRegistered');
});
