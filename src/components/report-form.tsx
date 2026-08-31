import { createReportAction } from '@/app/events/actions';

export function ReportForm({ proposalId, slug }: { proposalId: string; slug: string }) {
  return <form action={createReportAction} className="mt-6 border-t border-white/10 pt-6"><input type="hidden" name="proposalId" value={proposalId} /><input type="hidden" name="slug" value={slug} /><label><span className="form-label">通報カテゴリ</span><select name="category" required className="form-control"><option value="安全・違法の懸念">安全・違法の懸念</option><option value="禁止事項の疑い">禁止事項の疑い</option><option value="内容の誤り">内容の誤り</option><option value="その他">その他</option></select></label><label className="mt-4 block"><span className="form-label">内容</span><textarea name="details" required maxLength={3000} rows={4} className="form-control" /></label><button className="btn-ghost mt-4 w-full">通報を送る</button></form>;
}
