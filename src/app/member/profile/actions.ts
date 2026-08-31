'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';

const profileSchema = z.object({
  publicName: z.string().trim().min(1, '公開名を入力してください').max(80, '公開名は80文字以内です'),
  collaborationInterest: z.string().trim().min(1, '協力したい内容を入力してください').max(500, '協力したい内容は500文字以内です'),
  ageConfirmed: z.literal('on', { error: '18歳以上の確認が必要です' }),
});

export type ProfileActionState = { error: string | null };

export async function completeProfileAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  if (!isSupabaseConfigured()) {
    return { error: '認証・会員基盤が未接続です。管理者設定後に再度お試しください。' };
  }

  const parsed = profileSchema.safeParse({
    publicName: formData.get('publicName'),
    collaborationInterest: formData.get('collaborationInterest'),
    ageConfirmed: formData.get('ageConfirmed'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '入力内容を確認してください。' };
  }

  const termsVersionIds = formData.getAll('termsVersionId').filter((value): value is string => typeof value === 'string');
  if (termsVersionIds.length !== 3 || new Set(termsVersionIds).size !== 3) {
    return { error: '会員規約・免責事項・プライバシーポリシーの3文書すべてに同意してください。' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('complete_member_profile', {
    p_public_name: parsed.data.publicName,
    p_collaboration_interest: parsed.data.collaborationInterest,
    p_age_confirmed: true,
    p_terms_version_ids: termsVersionIds,
  });

  if (error) {
    if (error.message.includes('confirmed email')) {
      return { error: '確認済みメールアドレスが必要です。認証メールを確認してから再度お試しください。' };
    }
    if (error.message.includes('current terms')) {
      return { error: '規約が更新されています。3文書を開き直して、最新の内容に同意してください。' };
    }
    return { error: '登録を完了できませんでした。入力内容とログイン状態を確認してください。' };
  }

  redirect('/member');
}
