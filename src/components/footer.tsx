import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-[#050505] py-14 sm:py-16 md:py-20 text-[#f0ede8]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* Col 1: Navigate */}
          <div>
            <p className="font-mono text-xs font-semibold tracking-[0.2em] text-[#c8a45a] uppercase">
              Navigate
            </p>
            <div className="mt-4 flex flex-col gap-1 font-sans text-sm font-light text-[rgba(240,237,232,0.75)]">
              {[
                { label: 'Home', href: '#home' },
                { label: 'About', href: '#about' },
                { label: 'How It Works', href: '#philosophy' },
                { label: 'Events', href: '#events' },
                { label: 'Activity Log', href: '#recent' },
                { label: 'Join / Propose', href: '#join' },
                { label: 'Operating Guidelines', href: '#guidelines' },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex min-h-[36px] items-center py-1 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Col 2: Contact */}
          <div>
            <p className="font-mono text-xs font-semibold tracking-[0.2em] text-[#c8a45a] uppercase">
              Contact
            </p>
            <div className="mt-4 border-l-2 border-[#c8a45a] pl-4">
              <p className="font-sans text-base font-medium text-[#f0ede8]">お問い合わせ</p>
              <p className="mt-1 font-sans text-sm font-light leading-relaxed text-[rgba(240,237,232,0.65)]">
                AIueoについてのご連絡はこちらへ。
              </p>
              <a
                href="mailto:info@kouheikosehira.com"
                className="mt-3 inline-flex min-h-[44px] items-center break-all border-b border-[#c8a45a] font-mono text-sm font-semibold text-[#f0ede8] transition-colors hover:text-[#c8a45a]"
              >
                info@kouheikosehira.com
              </a>
            </div>
            <div className="mt-5 flex flex-col gap-1 border-t border-[rgba(240,237,232,0.08)] pt-4 font-sans text-sm font-light text-[rgba(240,237,232,0.55)]">
              <a
                href="https://github.com/rahiseko-alt/AIueo-LP"
                target="_blank"
                rel="noreferrer"
                className="flex min-h-[36px] items-center py-1 transition-colors hover:text-white"
              >
                GitHub (rahiseko-alt/AIueo-LP)
              </a>
            </div>
          </div>

          {/* Col 3: Location / Grassroots Philosophy */}
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="font-mono text-xs font-semibold tracking-[0.2em] text-[#c8a45a] uppercase">
              Where We Play
            </p>
            <div className="mt-4 font-sans text-sm font-light leading-relaxed text-[rgba(240,237,232,0.75)]">
              <p className="text-white font-medium">Tokyo, Japan & Online</p>
              <p className="mt-1">
                草野球のように集まり、AIを触り、1つのプロトタイプを作る草AI同盟。
              </p>
              <p className="mt-4 font-mono text-xs text-[#c8a45a]">
                0はいくら集めても0。まずは1つの草活動から。
              </p>
              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 font-mono text-[11px] text-[rgba(240,237,232,0.55)]">
                <Link href="/events" className="min-h-9 content-center hover:text-white">公開企画</Link>
                <Link href="/terms" className="min-h-9 content-center hover:text-white">会員規約</Link>
                <Link href="/disclaimer" className="min-h-9 content-center hover:text-white">免責事項</Link>
                <Link href="/privacy" className="min-h-9 content-center hover:text-white">プライバシー</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="mt-12 sm:mt-16 flex flex-col items-center justify-between gap-4 border-t border-[rgba(240,237,232,0.08)] pt-8 font-mono text-xs text-[rgba(240,237,232,0.45)] sm:flex-row text-center sm:text-left">
          <p>© 2026 AI League AIueo. Activities &amp; Experiment First.</p>
          <div className="flex items-center gap-6">
            <a href="#home" className="flex min-h-[44px] items-center transition-colors hover:text-white">
              Back to Top ↑
            </a>
            <a
              href="https://github.com/rahiseko-alt"
              target="_blank"
              rel="noreferrer"
              className="flex min-h-[44px] items-center transition-colors hover:text-white"
            >
              Captain GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
