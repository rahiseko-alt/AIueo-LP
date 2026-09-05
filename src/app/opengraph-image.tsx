import { ImageResponse } from 'next/og';
import { siteDescription, siteName, siteUrl } from '@/lib/site';

/**
 * SNSに貼ったときに出る画像。
 *
 * `public/images/japanese/*.png` は1枚2MB前後あり、OGP画像には大きすぎる。
 * ここで 1200×630 を生成する（`next/og` は Next.js 同梱で追加の依存は無い）。
 *
 * 文字を英字だけにしているのは、`next/og` が既定で持つフォントに日本語の
 * 字形が無く、和文を置くと空白になるためである。日本語の説明は og:description
 * と alt が担う。見た目の主従はヒーロー（`src/components/hero.tsx`）に合わせ、
 * ワードマークを最大にする。
 */
export const alt = `${siteName} — ${siteDescription}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#080808',
          color: '#f0ede8',
          padding: '80px 96px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            fontSize: 30,
            letterSpacing: 10,
            color: '#c8a45a',
          }}
        >
          <div style={{ width: 18, height: 18, borderRadius: 999, background: '#c8a45a' }} />
          <div>AI LEAGUE</div>
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 180,
            fontWeight: 700,
            color: '#c8a45a',
            marginTop: 16,
            lineHeight: 1,
          }}
        >
          Aiueo
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 46,
            letterSpacing: 6,
            marginTop: 40,
            color: 'rgba(240,237,232,0.9)',
          }}
        >
          THIS WAY. TOGETHER.
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 26,
            marginTop: 28,
            color: 'rgba(240,237,232,0.5)',
          }}
        >
          {siteUrl.replace('https://', '')}
        </div>
      </div>
    ),
    size,
  );
}
