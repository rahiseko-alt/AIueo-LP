import { chromium } from '@playwright/test';
const base = 'http://127.0.0.1:3100';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (let i = 0; i < 5; i++) {
  const page = await browser.newPage();
  let t0 = 0, t1 = 0;
  page.on('request', (r) => { if (r.url().includes('/api/auth/get-session')) t1 = Date.now(); });
  t0 = Date.now();
  await page.goto(`${base}/member/profile?neon_auth_session_verifier=fake-token`);
  const deadline = Date.now() + 20000;
  while (!t1 && Date.now() < deadline) await new Promise((r) => setTimeout(r, 50));
  console.log(i, t1 ? `交換まで ${t1 - t0}ms` : '20秒以内に交換なし');
  await page.close();
}
await browser.close();
