'use client';

import { useState } from 'react';
import Link from 'next/link';

export function Navbar() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex h-[68px] items-center justify-between border-b border-[rgba(240,237,232,0.06)] bg-[rgba(8,8,8,0.7)] px-6 backdrop-blur-2xl transition-all md:px-10">
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-sm font-semibold tracking-[0.2em] text-white uppercase"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#c8a45a]"></span>
          AI League AIueo
        </Link>

        {/* Desktop Nav Links */}
        <ul className="hidden items-center justify-center gap-0 md:flex">
          {[
            { label: 'About', href: '#about' },
            { label: 'Upcoming Events', href: '#events' },
            { label: 'Event Series', href: '#series' },
            { label: 'Recent Logs', href: '#recent' },
            { label: 'Community', href: '#team' },
            { label: 'Archive', href: '#archive' },
          ].map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="group relative block px-4 py-[22px] font-mono text-[11px] font-medium tracking-[0.14em] text-[rgba(240,237,232,0.75)] uppercase transition-colors hover:text-white"
              >
                {item.label}
                <span className="absolute bottom-0 left-4 right-4 h-[1px] scale-x-0 bg-[#c8a45a] transition-transform duration-300 group-hover:scale-x-100"></span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Right CTA / Menu */}
        <div className="flex items-center gap-3">
          <Link
            href="#events"
            className="hidden font-mono text-[11px] font-semibold tracking-[0.18em] text-white uppercase transition hover:text-[#c8a45a] sm:inline-block"
          >
            Join an Event
          </Link>
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 text-white md:hidden"
            aria-label="Toggle Menu"
          >
            <span
              className={`block h-0.5 w-5 bg-[#f0ede8] transition-transform duration-300 ${
                isDrawerOpen ? 'translate-y-2 rotate-45' : ''
              }`}
            ></span>
            <span
              className={`block h-0.5 w-5 bg-[#f0ede8] transition-opacity duration-300 ${
                isDrawerOpen ? 'opacity-0' : ''
              }`}
            ></span>
            <span
              className={`block h-0.5 w-5 bg-[#f0ede8] transition-transform duration-300 ${
                isDrawerOpen ? '-translate-y-2 -rotate-45' : ''
              }`}
            ></span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 top-[68px] z-40 flex flex-col items-center justify-center gap-6 bg-[#080808]/98 px-6 backdrop-blur-3xl md:hidden animate-fadeIn">
          {[
            { label: 'Home', href: '#home' },
            { label: 'About', href: '#about' },
            { label: 'Upcoming Events', href: '#events' },
            { label: 'Event Series', href: '#series' },
            { label: 'Recent Logs', href: '#recent' },
            { label: 'Community', href: '#team' },
            { label: 'Archive', href: '#archive' },
            { label: 'Join an Event', href: '#events' },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setIsDrawerOpen(false)}
              className="font-mono text-lg font-light tracking-[0.18em] text-[rgba(240,237,232,0.85)] uppercase transition hover:text-[#c8a45a]"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-6 flex gap-6 border-t border-[rgba(240,237,232,0.1)] pt-6 font-mono text-xs text-[rgba(240,237,232,0.5)]">
            <a href="https://github.com/rahiseko-alt" target="_blank" rel="noreferrer" className="hover:text-[#c8a45a]">
              GitHub
            </a>
            <a href="https://x.com" target="_blank" rel="noreferrer" className="hover:text-[#c8a45a]">
              X (Twitter)
            </a>
            <a href="https://discord.com" target="_blank" rel="noreferrer" className="hover:text-[#c8a45a]">
              Discord
            </a>
          </div>
        </div>
      )}
    </>
  );
}
