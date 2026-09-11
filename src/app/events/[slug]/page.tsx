import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/neon/db';
import { getAuthContext } from '@/lib/auth/dal';
import { formatLabel } from '@/lib/proposals/public';
import { ProposalImage } from '@/components/proposal-image';

export const dynamic = 'force-dynamic';

const MONEY_TYPE_LABELS: Record<string, string> = {
  none: 'なし',
  fixed_fee: '固定参加費',
  range_or_upper_limit: '幅・上限あり',
  reimbursement: '実費精算',
  reward: '報酬',
  donation: '寄付・カンパ',
  undecided: '未定',
};

const MONEY_DETAIL_LABELS: [string, string][] = [
  ['label', '説明'],
  ['amount', '金額・上限'],
  ['currency', '通貨'],
  ['recipient', '支払先'],
  ['collection_method', '徴収方法'],
  ['settlement', '精算方法'],
  ['refunds', '返金・中止時の扱い'],
  ['change_terms', '変更条件'],
];

function MoneyConditions({ moneyType, moneyDetails }: { moneyType: unknown; moneyDetails: unknown }) {
  const type = String(moneyType);
  const label = MONEY_TYPE_LABELS[type] ?? type;
  if (type === 'none') return <dd className="mt-2">なし</dd>;
  const details = (moneyDetails && typeof moneyDetails === 'object' ? moneyDetails : {}) as Record<string, unknown>;
  const entries = MONEY_DETAIL_LABELS.filter(([key]) => typeof details[key] === 'string' && details[key]);
  return (
    <dd className="mt-2">
      <p>{label}</p>
      {entries.length > 0 && (
        <dl className="mt-2 space-y-1 text-sm leading-6 text-white/70">
          {entries.map(([key, entryLabel]) => (
            <div key={key}><span className="text-white/50">{entryLabel}: </span>{String(details[key])}</div>
          ))}
        </dl>
      )}
    </dd>
  );
}

/**
 * 検索結果とSNSに出す、企画ごとの見出しと説明。
 *
 * 本文と同じ絞り込み条件（公開・public・期限内）で引く。条件を緩めると、
 * 下書きや期限切れの企画名が共有カードから漏れる。見つからない場合は
 * 企画名を出さず、既定の文言だけを返す。
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const fallback: Metadata = { title: '企画', alternates: { canonical: `/events/${slug}` } };
  if (!db) return fallback;

  const result = await db.$client.query(
    `select title, summary from proposals
     where slug = $1 and status = 'published' and visibility = 'public' and public_expires_at > now()
     limit 1`,
    [slug],
  );
  const proposal = result.rows[0] as { title: string; summary: string } | undefined;
  if (!proposal) return fallback;

  const description = proposal.summary.length > 120 ? `${proposal.summary.slice(0, 119)}…` : proposal.summary;
  return {
    title: proposal.title,
    description,
    alternates: { canonical: `/events/${slug}` },
    openGraph: { title: proposal.title, description, url: `/events/${slug}`, type: 'article' },
  };
}

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reported?: string }>;
}) {
  const { slug } = await params;
  const { reported } = await searchParams;
  if (!db) notFound();
  const result = await db.$client.query(
    `select id, owner_id, slug, title, summary, format, tentative_starts_at, recruitment_deadline_at,
      organizer_name, participation_method, visibility, money_type, money_details, published_at, image_mime
     from proposals
     where slug = $1 and status = 'published' and visibility = 'public' and public_expires_at > now()
     limit 1`,
    [slug],
  );
  const data = result.rows[0] as Record<string, unknown> | undefined;
  if (!data) notFound();

  // 閲覧者の立場で、次に押せるものを変える。
  //  - 企画者本人   … 自分の編集画面へ戻れる（公開ページから編集へ行けないと往復できない）
  //  - 登録済み会員 … 自分の会員ページへ
  //  - それ以外     … 会員登録へ（ただし「参加には要らない」と明記する）
  const context = await getAuthContext();
  const viewerId = context.kind === 'member' ? context.userId : context.kind === 'profile_missing' ? context.userId : null;
  const isOwner = viewerId !== null && viewerId === String(data.owner_id);
  const isActiveMember = context.kind === 'member' && context.profile.status === 'active';

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-8 text-[#f0ede8] sm:px-6 sm:py-12 md:px-10">
      <div className="mx-auto max-w-3xl">
        <nav aria-label="現在地" className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs font-semibold tracking-[0.16em] text-[#c8a45a]">
          <Link href="/" className="inline-flex min-h-11 items-center hover:text-white">AIueoトップ</Link>
          <span aria-hidden className="text-white/30">/</span>
          <Link href="/events" className="inline-flex min-h-11 items-center hover:text-white">企画一覧</Link>
          <span aria-hidden className="text-white/30">/</span>
          <span className="text-white/55">この企画</span>
        </nav>

        {reported === '1' && (
          <p role="status" className="mt-6 border border-[#c8a45a]/45 bg-[#12110d] p-4 text-sm leading-7 text-[#e4d2a6]">
            管理者への連絡を受け付けました。内容を確認し、必要があれば掲載を止めます。返信が要る場合は info@kouheikosehira.com へご連絡ください。
          </p>
        )}

        <article className="mt-8 border border-[rgba(200,164,90,0.42)] bg-[#12110d] p-6 sm:mt-10 sm:p-10">
          <p className="font-mono text-xs tracking-[0.2em] text-[#c8a45a]">EVENT DETAIL</p>
          <h1 className="mt-4 text-4xl font-light sm:text-5xl">{String(data.title)}</h1>
          <ProposalImage proposalId={String(data.id)} title={String(data.title)} hasImage={Boolean(data.image_mime)} />
          <p className="mt-6 whitespace-pre-line leading-8 text-white/78">{String(data.summary)}</p>

          <dl className="mt-8 grid gap-5 border-t border-white/10 pt-7 sm:grid-cols-2">
            <div><dt className="form-label">開催形式</dt><dd className="mt-2">{formatLabel(data.format)}</dd></div>
            <div><dt className="form-label">主催者</dt><dd className="mt-2">{String(data.organizer_name)}</dd></div>
            <div><dt className="form-label">候補日時</dt><dd className="mt-2">{data.tentative_starts_at ? new Date(String(data.tentative_starts_at)).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '未定'}</dd></div>
            <div><dt className="form-label">金銭条件</dt><MoneyConditions moneyType={data.money_type} moneyDetails={data.money_details} /></div>
            <div className="sm:col-span-2"><dt className="form-label">参加方法</dt><dd className="mt-2 whitespace-pre-line leading-7 text-white/75">{String(data.participation_method)}</dd></div>
          </dl>

          <p className="mt-8 border-l-2 border-[#c8a45a] pl-4 text-sm leading-7 text-white/70">
            <strong className="font-normal text-[#e4d2a6]">参加するのに会員登録は要りません。</strong>
            上の「参加方法」に書かれた方法で、主催者へ直接ご連絡ください。
            AIueoは企画の主催者・参加者・決済者ではありません。参加前に主催者へ内容を直接確認し、自己責任で参加してください。
          </p>

          {isOwner && (
            <section className="mt-8 border-t border-white/10 pt-7">
              <h2 className="text-xl font-light">この企画はあなたが登録したものです</h2>
              <p className="mt-2 text-sm leading-7 text-white/65">いまこのページは、誰でもこの見た目で見られます。</p>
              <Link href={`/member/proposals/${String(data.id)}`} className="btn-solid mt-5 inline-flex">この企画を編集する</Link>
            </section>
          )}
        </article>

        <section className="mt-8 border border-white/15 bg-[#12110d] p-6 sm:p-8">
          <h2 className="text-xl font-light">次にできること</h2>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/events" className="btn-ghost">ほかの企画を見る</Link>
            {isActiveMember ? (
              <Link href="/member" className="btn-ghost">自分の会員ページへ</Link>
            ) : (
              <Link href="/register" className="btn-ghost">自分も企画を立てる（会員登録）</Link>
            )}
            <Link href={`/events/${String(data.slug)}/report`} className="btn-ghost">管理者へ連絡</Link>
          </div>
          <p className="mt-5 text-sm leading-7 text-white/55">
            「管理者へ連絡」は、危険・違法・禁止事項の疑いがある掲載を知らせるための窓口です。緊急時は警察・救急を優先してください。
          </p>
        </section>
      </div>
    </main>
  );
}
