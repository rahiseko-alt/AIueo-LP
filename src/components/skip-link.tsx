'use client';

export function SkipLink() {
  return (
    <a
      href="#"
      onClick={(event) => {
        event.preventDefault();
        const main = document.querySelector('main');
        if (!main) return;
        main.setAttribute('tabindex', '-1');
        main.focus();
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-[#c8a45a] focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:font-semibold focus:text-[#080808] focus:outline-none"
    >
      本文へスキップ
    </a>
  );
}
