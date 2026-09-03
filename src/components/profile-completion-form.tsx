'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { completeProfileAction, type ProfileActionState } from '@/app/member/profile/actions';

type TermVersion = { id: string; document_type: 'terms' | 'disclaimer' | 'privacy'; version: string; effective_at: string };

const labels = { terms: ['会員規約', '/terms'], disclaimer: ['免責事項', '/disclaimer'], privacy: ['プライバシーポリシー', '/privacy'] } as const;

export function ProfileCompletionForm({ versions }: { versions: TermVersion[] }) {
  const [state, formAction, isPending] = useActionState<ProfileActionState, FormData>(completeProfileAction, { error: null });
  const byType = new Map(versions.map((version) => [version.document_type, version]));
  const isReady = (['terms', 'disclaimer', 'privacy'] as const).every((type) => byType.has(type));

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2"><span className="font-mono text-xs tracking-[0.12em] text-[#c8a45a]">公開名 *</span><input name="publicName" required maxLength={80} className="mt-2 min-h-11 w-full border border-white/20 bg-black/20 px-3 text-base outline-none focus:border-[#c8a45a]" /><span className="mt-2 block text-xs text-white/55">企画ページの主催者表示に使います。認証メールアドレスは公開しません。</span></label>
        <label className="block text-sm sm:col-span-2"><span className="font-mono text-xs tracking-[0.12em] text-[#c8a45a]">協力したい内容 *</span><textarea name="collaborationInterest" required maxLength={500} rows={4} className="mt-2 w-full resize-y border border-white/20 bg-black/20 px-3 py-2 text-base outline-none focus:border-[#c8a45a]" /><span className="mt-2 block text-xs text-white/55">初期版では会員一覧に公開しません。氏名・住所・電話番号・参加者情報は入力しないでください。</span></label>
      </div>
      <fieldset className="space-y-4 border-t border-white/10 pt-6"><legend className="font-mono text-xs tracking-[0.12em] text-[#c8a45a]">同意と確認 *</legend>
        <label className="flex min-h-11 items-start gap-3 text-sm leading-7"><input name="ageConfirmed" type="checkbox" required className="mt-2 h-4 w-4 accent-[#c8a45a]" />18歳以上であることを確認します。未成年向けイベントの参加者情報はAIueoへ入力しません。</label>
        {(['terms', 'disclaimer', 'privacy'] as const).map((type) => { const version = byType.get(type); const [label, href] = labels[type]; return <label key={type} className="flex min-h-11 items-start gap-3 text-sm leading-7"><input name="termsVersionId" value={version?.id ?? ''} type="checkbox" required disabled={!version} className="mt-2 h-4 w-4 accent-[#c8a45a]" /><span><Link href={href} target="_blank" className="text-[#d7bd82] underline hover:text-white">{label}</Link>（{version?.version ?? '未接続'}）を確認し、同意します。</span>{version && <input type="hidden" name={`version-${type}`} value={version.version} />}</label>; })}
      </fieldset>
      {!isReady && <p className="border border-[#c8a45a]/40 bg-[#c8a45a]/10 p-4 text-sm leading-7 text-white/75">最新の規約版を取得できるまで、会員有効化は開始できません。</p>}
      {state.error && <p role="alert" className="border border-red-300/40 bg-red-950/30 p-4 text-sm leading-7 text-red-100">{state.error}</p>}
      <button type="submit" disabled={!isReady || isPending} className="btn-solid w-full disabled:cursor-not-allowed disabled:opacity-45">{isPending ? '登録中…' : '同意して会員登録を完了する'}</button>
      <p className="text-xs leading-6 text-white/55">会員登録は管理者の承認制ではありません。上記の確認と同意が完了した時点で有効化されます。</p>
    </form>
  );
}
