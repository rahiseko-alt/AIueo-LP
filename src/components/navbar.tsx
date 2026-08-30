'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function Navbar() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  const navItems = [
    { label: 'About', href: '#about' },
    { label: 'Philosophy', href: '#philosophy' },
    { label: 'Events & Projects', href: '#events' },
    { label: 'Formats', href: '#series' },
    { label: 'Recent Logs', href: '#recent' },
    { label: 'Community', href: '#team' },
    { label: 'Archive', href: '#archive' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex h-16 md:h-[68px] items-center justify-between border-b transition-all duration-300 px-4 sm:px-6 md:px-8 lg:px-10 ${
          isScrolled
            ? 'border-[rgba(240,237,232,0.12)] bg-[#080808]/90 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
            : 'border-[rgba(240,237,232,0.06)] bg-[#080808]/75 backdrop-blur-xl'
        }`}
      >
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex min-h-[44px] items-center gap-2 font-mono text-xs sm:text-sm font-semibold tracking-[0.18em] sm:tracking-[0.2em] text-[#f0ede8] uppercase transition-opacity hover:opacity-80"
          onClick={() => setIsDrawerOpen(false)}
        >
          <span className="h-2 w-2 rounded-full bg-[#c8a45a] shadow-[0_0_8px_rgba(200,164,90,0.6)]"></span>
          <span>AI League AIueo</span>
        </Link>

        {/* Desktop Nav Links (Visible on lg: 1024px+) */}
        <ul className="hidden items-center justify-center gap-1 xl:gap-2 lg:flex">
          {navItems.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="group relative flex min-h-[44px] items-center px-3 py-2 font-mono text-[11px] xl:text-xs font-medium tracking-[0.12em] text-[rgba(240,237,232,0.75)] uppercase transition-colors hover:text-white"
              >
                {item.label}
                <span className="absolute bottom-1.5 left-3 right-3 h-[1.5px] scale-x-0 bg-[#c8a45a] transition-transform duration-300 group-hover:scale-x-100"></span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Right Action / Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="#join"
            className="hidden sm:inline-flex min-h-[44px] items-center rounded border border-[rgba(200,164,90,0.3)] bg-[rgba(200,164,90,0.06)] px-4 py-2 font-mono text-[11px] font-semibold tracking-[0.16em] text-[#f0ede8] uppercase transition-all duration-200 hover:border-[#c8a45a] hover:bg-[#c8a45a] hover:text-[#080808]"
          >
            Join / Propose
          </Link>

          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-[rgba(240,237,232,0.12)] bg-[rgba(240,237,232,0.03)] text-white transition-colors hover:border-[#c8a45a] hover:text-[#c8a45a] lg:hidden"
            aria-label={isDrawerOpen ? 'Close Menu' : 'Open Menu'}
            aria-expanded={isDrawerOpen}
          >
            <div className="flex h-4 w-5 flex-col justify-between">
              <span
                className={`block h-0.5 w-5 bg-current transition-transform duration-300 ease-in-out ${
                  isDrawerOpen ? 'translate-y-1.5 rotate-45' : ''
                }`}
              ></span>
              <span
                className={`block h-0.5 w-5 bg-current transition-opacity duration-200 ${
                  isDrawerOpen ? 'opacity-0' : ''
                }`}
              ></span>
              <span
                className={`block h-0.5 w-5 bg-current transition-transform duration-300 ease-in-out ${
                  isDrawerOpen ? '-translate-y-2 -rotate-45' : ''
                }`}
              ></span>
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer (Visible on < lg screens) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 top-16 z-40 flex flex-col justify-between overflow-y-auto bg-[#080808]/98 px-6 py-8 backdrop-blur-3xl lg:hidden animate-fadeIn">
          <div className="flex flex-col items-center gap-2 py-4">
            {[
              { label: 'Home', href: '#home' },
              ...navItems,
              { label: 'Join / Propose', href: '#join' },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsDrawerOpen(false)}
                className="flex min-h-[48px] w-full items-center justify-center rounded-lg py-2 font-mono text-base sm:text-lg font-light tracking-[0.18em] text-[rgba(240,237,232,0.85)] uppercase transition-all hover:bg-[rgba(200,164,90,0.1)] hover:text-[#c8a45a]"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col items-center gap-4 border-t border-[rgba(240,237,232,0.1)] pt-6 font-mono text-xs text-[rgba(240,237,232,0.5)]">
            <div className="flex flex-wrap justify-center gap-6">
              <a
                href="https://github.com/rahiseko-alt"
                target="_blank"
                rel="noreferrer"
                className="flex min-h-[44px] items-center px-2 py-1 transition-colors hover:text-[#c8a45a]"
              >
                GitHub
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="flex min-h-[44px] items-center px-2 py-1 transition-colors hover:text-[#c8a45a]"
              >
                X (Twitter)
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                className="flex min-h-[44px] items-center px-2 py-1 transition-colors hover:text-[#c8a45a]"
              >
                Discord
              </a>
            </div>
            <p className="text-[10px] tracking-widest text-[rgba(240,237,232,0.3)] uppercase">
              AI League AIueo · Grassroots Alliance
            </p>
          </div>
        </div>
      )}
    </>
  );
}
