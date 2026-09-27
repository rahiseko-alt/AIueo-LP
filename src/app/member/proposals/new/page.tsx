import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireActiveMember } from '@/lib/auth/dal';
import { db } from '@/lib/neon/db';
import { QuickProposalForm } from '@/components/quick-proposal-form';
import { saveProposalAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function NewProposalPage() {
  const member = await requireActiveMember();
  // 規約が更新され再同意が要る会員は、本文を書き終えてから保存で弾かれると遠回りになる。
  // 開いた時点で再同意の画面へ案内する。
  if (db) {
    const consent = await db.$client.query(
      `select count(*)::integer as count
       from terms_versions tv
       join consents c on c.terms_version_id = tv.id and c.user_id = $1
       where tv.is_current = true`,
      [member.userId],
    );
    if (Number(consent.rows[0]?.count) !== 3) redirect('/member/profile');
  }
  return <main className="min-h-screen bg-[#080808] px-4 py-8 text-[#f0ede8] sm:px-6 sm:py-12 md:px-10"><div className="mx-auto max-w-3xl"><nav aria-label="現在地" className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs font-semibold tracking-[0.16em] text-[#c8a45a]"><Link href="/member" className="inline-flex min-h-11 items-center hover:text-white">会員ページ</Link><span aria-hidden className="text-white/30">/</span><Link href="/member/proposals" className="inline-flex min-h-11 items-center hover:text-white">自分の企画</Link><span aria-hidden className="text-white/30">/</span><span className="text-white/55">新しい企画</span></nav><section className="mt-8 border border-[rgba(200,164,90,0.42)] bg-[#12110d] p-6 sm:mt-10 sm:p-10"><p className="font-mono text-xs tracking-[0.2em] text-[#c8a45a]">NEW PROPOSAL</p><h1 className="mt-4 text-4xl font-light sm:text-5xl">企画を立てる</h1><p className="mt-5 max-w-2xl leading-8 text-white/75">内容・参加方法・開催日の3つを入れて、公開ボタンを押せば公開されます。ほかの項目は、あとから編集できます。</p><QuickProposalForm action={saveProposalAction} publicName={member.profile.public_name} /></section></div></main>;
}
