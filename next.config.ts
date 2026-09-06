import type { NextConfig } from "next";

/**
 * 全レスポンスに付けるセキュリティヘッダ。
 *
 * 会員セッションと管理画面を持つため、クリックジャッキングとリファラ漏れは
 * 実害になる。CSP はインラインスクリプトとの相性を確認する必要があるので、
 * まず Report-Only で観測してから強制に切り替える。
 */
const securityHeaders = [
  // 管理画面や会員ページを他サイトの iframe に埋め込ませない。
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  // Content-Type の推測を止める。
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // 外部サイトへ会員ページのパスを渡さない。
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // 使っていない強力な API を明示的に閉じる。
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
];

const nextConfig: NextConfig = {
  // 稼働中のスタックとバージョンを無償で開示しない。
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
