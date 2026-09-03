import Link from 'next/link';
import { requireActiveMember } from '@/lib/auth/dal';

export const dynamic = 'force-dynamic';

export default async function MemberPage() {
  const { profile } = await requireActiveMember();
  return (
    <main className="min-h-screen bg-[#080808] px-4 py-8 text-[#f0ede8] sm:px-6 sm:py-12 md:px-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="inline-flex min-h-11 items-center font-mono text-xs font-semibold tracking-[0.16em] text-[#c8a45a] hover:text-white">← AIueoへ戻る</Link>
        <section className="mt-8 border border-[rgba(200,164,90,0.42)] bg-[#12110d] p-6 sm:p-10">
          <p className="font-mono text-xs font-semibold tracking-[0.22em] text-[#c8a45a]">MEMBER AREA</p>
          <h1 className="mt-4 text-4xl font-light">こんにちは、{profile.public_name ?? 'メンバー'}さん</h1>
          <p className="mt-4 leading-8 text-[rgba(240,237,232,0.76)]">会員登録は有効です。企画の下書き・公開・中止・開催決定・満席・終了は、企画者自身が操作します。</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/member/proposals/new" className="btn-solid">企画を登録する</Link><Link href="/member/proposals" className="btn-ghost">自分の企画</Link><Link href="/member/profile" className="btn-ghost">プロフィール・規約同意</Link></div>
        </section>
      </div>
    </main>
  );
}
