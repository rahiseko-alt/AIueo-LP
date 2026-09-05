import type { MetadataRoute } from 'next';
import { db } from '@/lib/neon/db';
import { siteUrl } from '@/lib/site';

// 公開中の企画はいつでも増減するため、都度作る。
export const dynamic = 'force-dynamic';

const STATIC_PATHS = ['/', '/events', '/register', '/contact', '/terms', '/privacy', '/disclaimer'];

/**
 * 公開中の企画。`src/app/events/page.tsx` と同じ絞り込み条件で引く。
 * 条件がずれると、一覧に出ていない企画を sitemap から拾わせることになる。
 *
 * データベースが無い環境やクエリ失敗では空を返す。sitemap が出ないより、
 * 固定ページだけでも出るほうがよい。
 */
async function getPublishedProposals() {
  if (!db) return [];
  try {
    const result = await db.$client.query(
      `select slug, coalesce(published_at, created_at) as updated_at
       from proposals
       where status = 'published' and visibility = 'public' and public_expires_at > now()`,
    );
    return result.rows as Array<{ slug: string; updated_at: string | null }>;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries = STATIC_PATHS.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === '/' || path === '/events' ? ('daily' as const) : ('monthly' as const),
    priority: path === '/' ? 1 : 0.7,
  }));

  const proposals = await getPublishedProposals();
  const proposalEntries = proposals.map((proposal) => ({
    url: `${siteUrl}/events/${proposal.slug}`,
    lastModified: proposal.updated_at ? new Date(proposal.updated_at) : now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  return [...staticEntries, ...proposalEntries];
}
