import Link from 'next/link';
import { requireActiveMember } from '@/lib/auth/dal';

export const dynamic = 'force-dynamic';

export default async function ProposalMessagesPage({ params }: { params: Promise<{ id: string }> }) {
  await requireActiveMember();
  const { id } = await params;
  return <main className="min-h-screen bg-[#080808] px-4 py-8 text-[#f0ede8] sm:px-6 sm:py-12 md:px-10"><div className="mx-auto max-w-3xl"><Link href={`/member/proposals/${id}`} className="inline-flex min-h-11 items-center font-mono text-xs tracking-[0.16em] text-[#c8a45a] hover:text-white">← 企画へ戻る</Link><section className="mt-8 border border-white/15 bg-[#12110d] p-6 sm:p-10"><p className="font-mono text-xs tracking-[0.2em] text-[#c8a45a]">PRIVATE THREAD</p><h1 className="mt-4 text-4xl font-light">管理者とのメッセージ</h1><p className="mt-4 leading-8 text-white/75">このスレッドは企画者と管理者だけが閲覧できます。送受信機能はP5で追加します。緊急の連絡は <a href="mailto:info@kouheikosehira.com" className="text-[#d7bd82] underline">info@kouheikosehira.com</a> へ。</p></section></div></main>;
}
