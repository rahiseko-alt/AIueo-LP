import 'server-only';
import { db } from '@/lib/neon/db';

// 公開データ(status='published' かつ visibility='public' かつ期限内)のみを返す。
// 会員/管理者専用画面から流用しない(自分の下書きや非公開企画は含まれない)。
export type PublicProposal = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  format: string;
  tentative_starts_at: string | null;
  organizer_name: string;
  participation_method: string;
  visibility: string;
  money_type: string;
  money_details: Record<string, string> | null;
  published_at: string | null;
};

export async function getPublicProposals(): Promise<PublicProposal[]> {
  if (!db) return [];
  const result = await db.$client.query(
    `select id, slug, title, summary, format, tentative_starts_at, organizer_name,
      participation_method, visibility, money_type, money_details, published_at
     from proposals
     where status = 'published' and visibility = 'public' and public_expires_at > now()
     order by tentative_starts_at asc`,
  );
  return result.rows as PublicProposal[];
}
