import Link from 'next/link';
import { getAuthContext } from '@/lib/auth/dal';

export const dynamic = 'force-dynamic';

export default async function MemberProfilePage() {
  const context = await getAuthContext();
  if (context.kind !== 'member') {
    return <main className="min-h-screen bg-[#080808] p-8 text-[#f0ede8]"><Link className="text-[#c8a45a] hover:text-white" href="/register">会員登録を開始する →</Link></main>;
  }
  const { profile } = context;
  return (
    <main className="min-h-screen bg-[#080808] px-4 py-8 text-[#f0ede8] sm:px-6 sm:py-12 md:px-10"><div className="mx-auto max-w-3xl"><Link href="/member" className="inline-flex min-h-11 items-center font-mono text-xs font-semibold tracking-[0.16em] text-[#c8a45a] hover:text-white">← 会員ページへ</Link><section className="mt-8 border border-[rgba(200,164,90,0.42)] bg-[#12110d] p-6 sm:p-10"><p className="font-mono text-xs font-semibold tracking-[0.22em] text-[#c8a45a]">PROFILE</p><h1 className="mt-4 text-4xl font-light">登録内容</h1><dl className="mt-8 grid gap-6 text-sm sm:grid-cols-2"><div><dt className="font-mono text-xs tracking-[0.12em] text-[#c8a45a]">公開名</dt><dd className="mt-2 text-lg">{profile.public_name ?? '未登録'}</dd></div><div><dt className="font-mono text-xs tracking-[0.12em] text-[#c8a45a]">会員状態</dt><dd className="mt-2 text-lg">{profile.status}</dd></div><div className="sm:col-span-2"><dt className="font-mono text-xs tracking-[0.12em] text-[#c8a45a]">協力したい内容</dt><dd className="mt-2 leading-7 text-[rgba(240,237,232,0.76)]">{profile.collaboration_interest ?? '未登録'}</dd></div></dl><p className="mt-8 text-sm leading-7 text-[rgba(240,237,232,0.6)]">プロフィール入力と同意記録の安全な保存は、認証基盤の接続後にこの画面へ追加します。</p></section></div></main>
  );
}
