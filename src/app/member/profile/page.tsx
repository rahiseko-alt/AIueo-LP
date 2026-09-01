import Link from 'next/link';
import { getAuthContext } from '@/lib/auth/dal';
import { db } from '@/lib/neon/db';
import { ProfileCompletionForm } from '@/components/profile-completion-form';

export const dynamic = 'force-dynamic';

type TermVersion = { id: string; document_type: 'terms' | 'disclaimer' | 'privacy'; version: string; effective_at: string };

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen bg-[#080808] px-4 py-8 text-[#f0ede8] sm:px-6 sm:py-12 md:px-10"><div className="mx-auto max-w-3xl"><Link href="/" className="inline-flex min-h-11 items-center font-mono text-xs font-semibold tracking-[0.16em] text-[#c8a45a] hover:text-white">← AIueoへ戻る</Link>{children}</div></main>;
}

export default async function MemberProfilePage() {
  const context = await getAuthContext();
  if (context.kind === 'unconfigured') {
    return <Shell><section className="mt-8 border border-[#c8a45a]/40 bg-[#12110d] p-6 sm:p-10"><p className="font-mono text-xs tracking-[0.2em] text-[#c8a45a]">MEMBERSHIP</p><h1 className="mt-4 text-3xl font-light">会員基盤を準備中です</h1><p className="mt-4 leading-8 text-white/75">認証とデータベースの接続後に、プロフィール登録を再開できます。</p><Link href="/register" className="btn-ghost mt-7">登録ページへ</Link></section></Shell>;
  }
  if (context.kind === 'signed_out') {
    return <Shell><section className="mt-8 border border-[#c8a45a]/40 bg-[#12110d] p-6 sm:p-10"><h1 className="text-3xl font-light">ログインが必要です</h1><p className="mt-4 leading-8 text-white/75">企画を掲載・管理する人は、外部認証でログインしてください。</p><Link href="/register" className="btn-solid mt-7">会員登録・ログイン</Link></section></Shell>;
  }
  if (context.kind === 'member' && (context.profile.status === 'suspended' || context.profile.status === 'withdrawn')) {
    return <Shell><section className="mt-8 border border-red-300/35 bg-[#18100f] p-6 sm:p-10"><p className="font-mono text-xs tracking-[0.2em] text-[#d7bd82]">READ ONLY</p><h1 className="mt-4 text-3xl font-light">会員状態を確認してください</h1><p className="mt-4 leading-8 text-white/75">現在の状態: <strong className="text-white">{context.profile.status === 'suspended' ? '利用停止' : '退会済み'}</strong>。新しい企画の登録・編集・公開はできません。</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/member/history" className="btn-ghost">自分の履歴を見る</Link><Link href="/contact" className="btn-ghost">異議・お問い合わせ</Link></div></section></Shell>;
  }

  let versions: TermVersion[] = [];
  if (db) {
    const result = await db.$client.query('select id, document_type, version, effective_at from terms_versions where is_current = true');
    versions = result.rows as TermVersion[];
  }

  if (context.kind === 'member' && context.profile.status === 'active') {
    return <Shell><section className="mt-8 border border-[rgba(200,164,90,0.42)] bg-[#12110d] p-6 sm:p-10"><p className="font-mono text-xs tracking-[0.2em] text-[#c8a45a]">PROFILE</p><h1 className="mt-4 text-4xl font-light">登録内容</h1><dl className="mt-8 grid gap-6 text-sm sm:grid-cols-2"><div><dt className="font-mono text-xs tracking-[0.12em] text-[#c8a45a]">公開名</dt><dd className="mt-2 text-lg">{context.profile.public_name}</dd></div><div><dt className="font-mono text-xs tracking-[0.12em] text-[#c8a45a]">会員状態</dt><dd className="mt-2 text-lg">有効</dd></div><div className="sm:col-span-2"><dt className="font-mono text-xs tracking-[0.12em] text-[#c8a45a]">協力したい内容</dt><dd className="mt-2 leading-7 text-white/75">{context.profile.collaboration_interest}</dd></div></dl><div className="mt-8 flex flex-wrap gap-3"><Link href="/member" className="btn-solid">会員ページへ</Link><Link href="/member/history" className="btn-ghost">企画・メッセージ履歴</Link></div></section></Shell>;
  }

  return <Shell><section className="mt-8 border border-[rgba(200,164,90,0.42)] bg-[#12110d] p-6 sm:p-10"><p className="font-mono text-xs tracking-[0.2em] text-[#c8a45a]">PROFILE / RESUME</p><h1 className="mt-4 text-4xl font-light">会員登録を完了する</h1><p className="mt-4 leading-8 text-white/75">ログイン済みです。公開名・協力したい内容・18歳以上の確認・3文書への同意が揃うと、管理者の承認なしで会員が有効化されます。</p><ProfileCompletionForm versions={versions} /></section></Shell>;
}
