export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white py-8 text-center font-mono text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>© 2026 AIueo. Activities first.</div>
        <div className="flex gap-4">
          <a href="#hero" className="hover:underline">Top</a>
          <a href="#next" className="hover:underline">Next</a>
          <a href="#archive" className="hover:underline">Archive</a>
        </div>
      </div>
    </footer>
  );
}
