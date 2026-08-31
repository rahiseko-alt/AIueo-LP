import Link from 'next/link';
import { getAuthContext } from '@/lib/auth/dal';

export const dynamic = 'force-dynamic';

export default async function MemberHistoryPage() {
  const context = await getAuthContext();
  if (context.kind !== 'member') return <main className="min-h-screen bg-[#080808] p-8 text-[#f0ede8]"><Link href="/register" className="text-[#c8a45a] hover:text-white">ログインして履歴を見る →</Link></main>;
  return <main className="min-h-screen bg-[#080808] px-4 py-8 text-[#f0ede8] sm:px-6 sm:py-12 md:px-10"><div className="mx-auto max-w-3xl"><Link href="/member/profile" className="inline-flex min-h-11 items-center font-mono text-xs tracking-[0.16em] text-[#c8a45a] hover:text-white">← プロフィールへ</Link><section className="mt-8 border border-white/15 bg-[#12110d] p-6 sm:p-10"><p className="font-mono text-xs tracking-[0.2em] text-[#c8a45a]">READ-ONLY HISTORY</p><h1 className="mt-4 text-4xl font-light">企画とメッセージ</h1><p className="mt-4 leading-8 text-white/75">停止・退会後も、自分の企画、措置理由、管理者とのメッセージ、同意履歴を読み返せる設計です。実データの表示はSupabase接続後に有効になります。</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/contact" className="btn-ghost">異議・お問い合わせ</Link><Link href="/terms" className="btn-ghost">規約を確認</Link></div></section></div></main>;
}
