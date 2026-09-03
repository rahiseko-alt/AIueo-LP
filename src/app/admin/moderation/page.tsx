import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/dal';
import { db } from '@/lib/neon/db';
import { adminResolveReportAction } from '@/app/admin/actions';

export const dynamic = 'force-dynamic';

export default async function AdminModerationPage() {
  await requireAdmin(); let reports: Array<{ id: string; proposal_id: string; category: string; details: string; created_at: string; resolved_at: string | null }> = [];
  if (db) { const result = await db.$client.query('select id, proposal_id, category, details, created_at, resolved_at from reports order by created_at desc'); reports = result.rows as typeof reports; }
  return <main className="min-h-screen bg-[#080808] px-4 py-8 text-[#f0ede8] sm:px-6 sm:py-12 md:px-10"><div className="mx-auto max-w-6xl"><Link href="/admin" className="inline-flex min-h-11 items-center font-mono text-xs tracking-[0.16em] text-[#c8a45a] hover:text-white">← 管理画面</Link><header className="mt-8 sm:mt-12"><p className="font-mono text-xs tracking-[0.2em] text-[#c8a45a]">MODERATION</p><h1 className="mt-4 text-4xl font-light">通報・措置</h1><p className="mt-4 leading-8 text-white/70">通報は公開停止などの判断材料です。措置には必ず理由・差分・通知・監査を残します。</p></header>{reports.length === 0 ? <section className="mt-10 border border-white/15 bg-[#12110d] p-6">通報はありません。</section> : <div className="mt-10 grid gap-5">{reports.map((report) => <section key={report.id} className="border border-white/15 bg-[#12110d] p-6"><div className="flex flex-wrap justify-between gap-3"><p className="form-label">{report.category}</p><span className="font-mono text-xs text-white/50">{report.resolved_at ? '処理済み' : '未処理'}</span></div><p className="mt-4 whitespace-pre-line leading-7 text-white/75">{report.details}</p><p className="mt-3 font-mono text-[10px] text-white/40">企画: {report.proposal_id} · {new Date(report.created_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</p>{!report.resolved_at && <form action={adminResolveReportAction} className="mt-5 grid gap-3 sm:grid-cols-[1fr_2fr_auto]"><input type="hidden" name="reportId" value={report.id} /><input name="reasonCode" required defaultValue="reviewed" className="form-control" placeholder="理由コード" /><input name="reasonText" required className="form-control" placeholder="確認・措置の理由" /><button className="btn-ghost">処理済みにする</button></form>}</section>)}</div>}</div></main>;
}
