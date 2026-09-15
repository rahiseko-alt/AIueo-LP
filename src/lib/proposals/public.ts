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
  /** 添付画像の種類。画像の中身はここでは引かない（一覧で数百KB×件数を読むため）。 */
  image_mime: string | null;
};

export async function getPublicProposals(): Promise<PublicProposal[]> {
  if (!db) return [];
  const result = await db.$client.query(
    `select id, slug, title, summary, format, tentative_starts_at, organizer_name,
      participation_method, visibility, money_type, money_details, published_at, image_mime
     from proposals
     where status = 'published' and visibility = 'public' and public_expires_at > now()
     order by tentative_starts_at asc`,
  );
  return result.rows as PublicProposal[];
}

/**
 * 開催形式の表示名。
 *
 * DBには `offline` / `online` / `hybrid` が入る。企画フォームでは
 * 「オフライン」等の日本語で選ばせているのに、公開ページはDBの英語値を
 * そのまま出していた（2026-09-10、本番で「開催形式 offline」と出ているのを確認）。
 * 未知の値が来たらそのまま返す。表示を落とさないため。
 */
export const EVENT_FORMAT_LABELS: Record<string, string> = {
  offline: 'オフライン',
  online: 'オンライン',
  hybrid: 'ハイブリッド',
};

export function formatLabel(value: unknown): string {
  const key = String(value ?? '');
  return EVENT_FORMAT_LABELS[key] ?? key;
}
