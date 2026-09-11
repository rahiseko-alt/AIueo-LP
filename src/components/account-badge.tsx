import Link from 'next/link';
import { getAuthContext } from '@/lib/auth/dal';

/**
 * 右上に固定表示する、ログイン状態を示す丸いバッジ。
 *
 * ログインしていない・認証基盤が未設定のときは何も描画しない
 * （既存の各ページの「登録・ログイン」導線を変えないため）。
 * ログイン済みのときだけ現れることで、ログインの成否がページを問わず
 * 一目でわかるようにする。
 */
export async function AccountBadge() {
  const context = await getAuthContext();

  if (context.kind === 'unconfigured' || context.kind === 'signed_out') {
    return null;
  }

  if (context.kind === 'profile_missing') {
    return (
      <Link
        href="/member/profile"
        aria-label="会員登録が未完了です。続きを入力してください。"
        title="会員登録が未完了です"
        className="fixed right-3 top-20 z-[60] flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#c8a45a] bg-[#12110d] font-mono text-sm font-semibold text-[#c8a45a] shadow-[0_4px_14px_rgba(0,0,0,0.5)] transition-transform hover:scale-105 sm:right-5"
      >
        !
      </Link>
    );
  }

  const { profile } = context;
  const isActive = profile.status === 'active';
  const initial = (profile.public_name?.trim()?.[0] ?? 'A').toUpperCase();
  const label = isActive
    ? `会員ページ（${profile.public_name ?? '会員'}）`
    : '会員状態を確認してください';
  // 有効な会員は、プロフィールではなく会員ページ（企画の入口）へ送る。
  // どのページからでも1回で自分の作業場所へ戻れることが、ここの役目である。
  // 停止・退会中の人は操作する場所が無いので、状態を説明する画面へ送る。
  const destination = isActive ? '/member' : '/member/profile';

  return (
    <Link
      href={destination}
      aria-label={label}
      title={label}
      className={`fixed right-3 top-20 z-[60] flex h-10 w-10 items-center justify-center rounded-full border-2 font-mono text-sm font-semibold shadow-[0_4px_14px_rgba(0,0,0,0.5)] transition-transform hover:scale-105 sm:right-5 ${
        isActive
          ? 'border-[#c8a45a] bg-[#c8a45a] text-[#080808]'
          : 'border-[rgba(240,237,232,0.5)] bg-[#12110d] text-[rgba(240,237,232,0.75)]'
      }`}
    >
      {initial}
    </Link>
  );
}
