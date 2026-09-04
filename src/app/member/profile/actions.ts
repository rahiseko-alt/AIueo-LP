'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { neonAuth } from '@/lib/neon/auth';
import { db } from '@/lib/neon/db';

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
  if (!neonAuth || !db) {
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

  const { data: session } = await neonAuth.getSession();
  const user = session?.user as { id?: string; emailVerified?: boolean } | undefined;
  if (!user?.id) return { error: 'ログイン状態を確認できませんでした。もう一度ログインしてください。' };
  if (user.emailVerified !== true) return { error: '確認済みメールアドレスが必要です。認証メールを確認してから再度お試しください。' };

  const client = await db.$client.connect();
  try {
    await client.query('begin');

    // 停止・退会は管理者の措置なので、本人がこの経路で active に戻せてはいけない。
    // 画面ではフォームを出していないが、サーバーアクションは直接呼べるためここで弾く。
    // 行ロックを取ってから読むことで、措置と同時に走っても後勝ちで復活しない。
    const existing = await client.query('select status from profiles where id = $1 for update', [user.id]);
    const currentStatus = existing.rows[0]?.status as string | undefined;
    if (currentStatus === 'suspended' || currentStatus === 'withdrawn') {
      await client.query('rollback');
      return { error: '現在の会員状態では登録内容を変更できません。お問い合わせください。' };
    }

    const current = await client.query('select id from terms_versions where is_current = true order by document_type');
    const currentIds = current.rows.map((row) => row.id as string);
    if (currentIds.length !== 3 || currentIds.some((id) => !termsVersionIds.includes(id))) {
      await client.query('rollback');
      return { error: '規約が更新されています。3文書を開き直して、最新の内容に同意してください。' };
    }
    await client.query(
      `insert into profiles (id, status, public_name, collaboration_interest)
       values ($1, 'active', $2, $3)
       on conflict (id) do update set status = 'active', public_name = excluded.public_name, collaboration_interest = excluded.collaboration_interest`,
      [user.id, parsed.data.publicName, parsed.data.collaborationInterest],
    );
    await client.query(
      'insert into consents (user_id, terms_version_id) select $1, unnest($2::uuid[]) on conflict do nothing',
      [user.id, currentIds],
    );
    await client.query(
      `insert into audit_log (actor_id, entity_type, entity_id, action, after_state)
       values ($1, 'profile', $1, 'member_activated', jsonb_build_object('public_name', $2))`,
      [user.id, parsed.data.publicName],
    );
    await client.query('commit');
  } catch {
    await client.query('rollback');
    return { error: '登録を完了できませんでした。時間をおいて再度お試しください。' };
  } finally {
    client.release();
  }

  redirect('/member');
}
