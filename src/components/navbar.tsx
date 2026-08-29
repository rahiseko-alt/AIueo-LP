import Link from 'next/link';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-mono text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          AIueo / ACTIVITIES
        </Link>
        <nav className="flex items-center gap-6 font-mono text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          <Link href="#next" className="transition hover:text-zinc-950 dark:hover:text-white">
            Next
          </Link>
          <Link href="#projects" className="transition hover:text-zinc-950 dark:hover:text-white">
            Projects
          </Link>
          <Link href="#recent" className="transition hover:text-zinc-950 dark:hover:text-white">
            Recent
          </Link>
          <Link href="#people" className="transition hover:text-zinc-950 dark:hover:text-white">
            People
          </Link>
          <Link href="#archive" className="transition hover:text-zinc-950 dark:hover:text-white">
            Archive
          </Link>
          <Link
            href="#join"
            className="rounded-full bg-zinc-900 px-3.5 py-1.5 font-sans font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            Join
          </Link>
        </nav>
      </div>
    </header>
  );
}
