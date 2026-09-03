import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/dal';
import { db } from '@/lib/neon/db';
import { adminSetMemberStatusAction } from '@/app/admin/actions';

export const dynamic = 'force-dynamic';

export default async function AdminMembersPage() {
  await requireAdmin();
  let members: Array<{ id: string; role: string; status: string; public_name: string | null; collaboration_interest: string | null }> = [];
  if (db) { const result = await db.$client.query('select id, role, status, public_name, collaboration_interest from profiles order by created_at desc'); members = result.rows as typeof members; }
  return <main className="min-h-screen bg-[#080808] px-4 py-8 text-[#f0ede8] sm:px-6 sm:py-12 md:px-10"><div className="mx-auto max-w-6xl"><Link href="/admin" className="inline-flex min-h-11 items-center font-mono text-xs tracking-[0.16em] text-[#c8a45a] hover:text-white">← 管理画面</Link><header className="mt-8 sm:mt-12"><p className="font-mono text-xs tracking-[0.2em] text-[#c8a45a]">MEMBERS</p><h1 className="mt-4 text-4xl font-light">会員管理</h1><p className="mt-4 max-w-2xl leading-8 text-white/70">会員の事前承認は行いません。場を乱す場合に限り、理由を記録して停止・登録取消を行います。</p></header>{members.length === 0 ? <section className="mt-10 border border-white/15 bg-[#12110d] p-6">会員はまだありません。</section> : <div className="mt-10 grid gap-5 lg:grid-cols-2">{members.map((member) => <section key={member.id} className="border border-white/15 bg-[#12110d] p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl">{member.public_name ?? '未設定'}</h2><p className="mt-1 font-mono text-xs text-white/45">{member.role} · {member.status}</p></div><p className="max-w-[15rem] break-all text-right font-mono text-[10px] text-white/35">{member.id}</p></div><p className="mt-4 text-sm leading-7 text-white/65">{member.collaboration_interest ?? '協力内容未設定'}</p><form action={adminSetMemberStatusAction} className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><input type="hidden" name="userId" value={member.id} /><select name="status" defaultValue={member.status === 'active' ? 'suspended' : 'active'} className="form-control"><option value="active">active（再有効化）</option><option value="suspended">suspended（停止）</option><option value="withdrawn">withdrawn（登録取消）</option></select><input name="reasonCode" required defaultValue="moderation" className="form-control" placeholder="理由コード" /><input name="reasonText" required className="form-control" placeholder="理由" /><button className="btn-ghost sm:col-span-3">理由を記録して変更</button></form></section>)}</div>}</div></main>;
}
