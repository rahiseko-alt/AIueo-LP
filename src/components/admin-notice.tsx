const MESSAGES: Record<string, string> = {
  input: '入力内容が不正でした。変更は保存していません。',
  transition: 'その状態へは変更できません。自動処理専用の状態と、現在と同じ状態は選べません。変更は保存していません。',
  failed: '保存できませんでした。変更は適用されていません。時間をおいて再度お試しください。',
};

/**
 * 管理操作の失敗を必ず画面へ出す。
 * 失敗を黙って握り潰すと、危険な企画の非公開化や会員の停止が
 * 実際には効いていないのに、成功したと誤認される。
 */
export function AdminNotice({ code }: { code?: string }) {
  if (!code) return null;
  const message = MESSAGES[code] ?? MESSAGES.failed;
  return (
    <p
      role="alert"
      className="mt-6 border border-[#e0796a]/60 bg-[#e0796a]/10 p-4 text-sm leading-7 text-[#f4c8c0]"
    >
      {message}
    </p>
  );
}
