import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-[#050505] py-16 text-[#f0ede8]">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
          {/* Col 1: Navigate */}
          <div>
            <p className="font-mono text-xs font-semibold tracking-[0.2em] text-[#c8a45a] uppercase">
              Navigate
            </p>
            <div className="mt-4 flex flex-col gap-2 font-sans text-sm font-light text-[rgba(240,237,232,0.7)]">
              <Link href="#home" className="transition hover:text-white">
                Home
              </Link>
              <Link href="#about" className="transition hover:text-white">
                About League
              </Link>
              <Link href="#events" className="transition hover:text-white">
                Events
              </Link>
              <Link href="#projects" className="transition hover:text-white">
                Projects
              </Link>
              <Link href="#recent" className="transition hover:text-white">
                Recent Activities
              </Link>
              <Link href="#team" className="transition hover:text-white">
                League Members
              </Link>
              <Link href="#archive" className="transition hover:text-white">
                Archive
              </Link>
              <Link href="#join" className="transition hover:text-white">
                Join Us
              </Link>
            </div>
          </div>

          {/* Col 2: Get in Touch */}
          <div>
            <p className="font-mono text-xs font-semibold tracking-[0.2em] text-[#c8a45a] uppercase">
              Get in Touch
            </p>
            <div className="mt-4 flex flex-col gap-2 font-sans text-sm font-light text-[rgba(240,237,232,0.7)]">
              <a
                href="https://github.com/rahiseko-alt/AIueo-LP"
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-white"
              >
                GitHub (rahiseko-alt/AIueo-LP)
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-white"
              >
                X (Twitter)
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-white"
              >
                Discord Server
              </a>
              <a
                href="mailto:rahiseko@gmail.com"
                className="break-all transition hover:text-white"
              >
                rahiseko@gmail.com
              </a>
            </div>
          </div>

          {/* Col 3: Location / Grassroots Philosophy */}
          <div>
            <p className="font-mono text-xs font-semibold tracking-[0.2em] text-[#c8a45a] uppercase">
              Where We Play
            </p>
            <div className="mt-4 font-sans text-sm font-light leading-relaxed text-[rgba(240,237,232,0.7)]">
              <p className="text-white font-medium">Tokyo, Japan & Online</p>
              <p className="mt-1">
                草野球のように集まり、AIを触り、1つのプロトタイプを作る草AI同盟。
              </p>
              <p className="mt-4 font-mono text-xs text-[#c8a45a]">
                0はいくら集めても0。まずは1つの草活動から。
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-[rgba(240,237,232,0.08)] pt-8 font-mono text-xs text-[rgba(240,237,232,0.4)] sm:flex-row">
          <p>© 2026 AI League AIueo. Activities &amp; Experiment First.</p>
          <div className="flex gap-6">
            <a href="#home" className="hover:text-white">
              Back to Top ↑
            </a>
            <a href="https://github.com/rahiseko-alt" target="_blank" rel="noreferrer" className="hover:text-white">
              Captain GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
