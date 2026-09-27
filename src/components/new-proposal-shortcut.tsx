'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * 右上のバッジの横に出す「＋ 企画を立てる」。有効な会員にだけ出す（P40）。
 *
 * どのページからでも1回で登録画面を開けるようにするためのもの。
 * 登録画面そのものでは出さない（押しても同じ画面になるだけなので）。
 */
export function NewProposalShortcut() {
  const pathname = usePathname();
  if (pathname === '/member/proposals/new') return null;
  return (
    <Link
      href="/member/proposals/new"
      aria-label="新しい企画を立てる"
      className="fixed right-16 top-20 z-[60] flex h-10 items-center rounded-full border-2 border-[#c8a45a] bg-[#12110d] px-3 font-mono text-xs font-semibold tracking-[0.08em] text-[#c8a45a] shadow-[0_4px_14px_rgba(0,0,0,0.5)] transition-colors hover:bg-[#c8a45a] hover:text-[#080808] sm:right-[4.5rem]"
    >
      ＋ 企画
    </Link>
  );
}
