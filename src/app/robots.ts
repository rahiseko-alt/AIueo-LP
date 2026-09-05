import type { MetadataRoute } from 'next';
import { privatePathPrefixes, siteUrl } from '@/lib/site';

/**
 * 検索エンジンへの指示。
 *
 * 会員・管理・APIの経路は検索結果に出す意味が無い。認可はサーバー側で
 * 毎回検証しているので、ここに書くことがセキュリティになるわけではない。
 * 目的は、公開したい内容だけを検索対象にすることである。
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: privatePathPrefixes.map((prefix) => `${prefix}/`),
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
