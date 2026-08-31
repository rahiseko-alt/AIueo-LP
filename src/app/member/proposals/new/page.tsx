import Link from 'next/link';
import { requireActiveMember } from '@/lib/auth/dal';
import { ProposalForm } from '@/components/proposal-form';

export const dynamic = 'force-dynamic';

export default async function NewProposalPage() {
  await requireActiveMember();
  return <main className="min-h-screen bg-[#080808] px-4 py-8 text-[#f0ede8] sm:px-6 sm:py-12 md:px-10"><div className="mx-auto max-w-4xl"><Link href="/member" className="inline-flex min-h-11 items-center font-mono text-xs font-semibold tracking-[0.16em] text-[#c8a45a] hover:text-white">← 会員ページへ</Link><section className="mt-8 border border-[rgba(200,164,90,0.42)] bg-[#12110d] p-6 sm:mt-10 sm:p-10"><p className="font-mono text-xs tracking-[0.2em] text-[#c8a45a]">NEW PROPOSAL</p><h1 className="mt-4 text-4xl font-light sm:text-5xl">企画を登録する</h1><p className="mt-5 max-w-2xl leading-8 text-white/75">やりたいことを下書きし、内容が整ったら自分で公開します。AIueoは企画の当事者にならず、参加申込や決済も保存しません。</p><div className="mt-5 border-l-2 border-[#c8a45a] pl-4 text-sm leading-7 text-white/65">公開期限の1週間前に未確定なら注意通知、3日前に開催決定がなければ自動的に公開から除外します。候補日時は必須です。</div><ProposalForm /></section></div></main>;
}
