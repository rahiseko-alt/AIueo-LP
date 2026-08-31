'use client';

import { useState } from 'react';

const email = 'info@kouheikosehira.com';

export function ContactActions() {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('メールアドレスをコピーしてください', email);
    }
  };

  return (
    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={copyEmail}
        className="inline-flex min-h-[48px] items-center justify-center border border-[#c8a45a] bg-[#c8a45a] px-5 font-mono text-sm font-semibold text-[#080808] transition-colors hover:bg-[#e0bd72]"
      >
        {copied ? 'コピーしました' : 'メールアドレスをコピー'}
      </button>
      <a
        href={`mailto:${email}`}
        className="inline-flex min-h-[48px] items-center justify-center border border-[rgba(240,237,232,0.25)] px-5 font-mono text-sm font-semibold text-[#f0ede8] transition-colors hover:border-[#c8a45a] hover:text-[#c8a45a]"
      >
        メールアプリで開く
      </a>
    </div>
  );
}
