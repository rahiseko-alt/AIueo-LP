import Image from 'next/image';
import { Activity } from '@/types';

interface HeroProps {
  activity: Activity;
}

export function Hero({ activity }: HeroProps) {
  return (
    <section id="home" className="relative pt-16 md:pt-[68px]">
      <div className="hero-split border-b border-[rgba(240,237,232,0.08)] bg-[#080808]">
        <div className="hero-copy flex flex-col items-center justify-center px-5 py-10 text-center sm:px-8 sm:py-14 md:px-12 md:py-16 lg:items-start lg:text-left">
          <div className="mb-6 inline-flex max-w-full items-center gap-2 font-mono text-[10px] font-medium tracking-[0.18em] text-[#c8a45a] uppercase sm:text-[11px] sm:tracking-[0.22em]">
            <span className="h-1.5 w-1.5 flex-shrink-0 animate-ping rounded-full bg-[#c8a45a]" />
            <span className="truncate">AI League · Grassroots Action Alliance</span>
          </div>

          <h1 className="font-sans text-[clamp(2rem,8vw,4rem)] font-light leading-[0.95] tracking-tight text-[#f0ede8]">
            Initiative
            <span className="my-1 block font-mono text-xl font-extralight text-[#c8a45a]/70 sm:text-2xl">×</span>
            Co-Creation
            <span className="my-1 block font-mono text-xl font-extralight text-[#c8a45a]/70 sm:text-2xl">×</span>
            Alliance
          </h1>

          <p className="mt-7 max-w-lg border-l-2 border-[#c8a45a] pl-4 text-left font-sans text-sm font-medium leading-relaxed text-[#c8a45a] sm:mt-8 sm:text-base lg:text-left">
            「今度一緒になにかできたらいいですね」を、
            <br />
            「こういうのやるんですけど、一緒にどうですか？」に変える場。
          </p>

          <p className="mt-4 max-w-md font-sans text-xs font-light leading-relaxed text-[rgba(240,237,232,0.72)] sm:text-sm">
            主婦向けセミナー、子ども向けAI教室、受託開発、LT会など、ジャンルを問わず「やりたい企画」を形にする草AI同盟。
          </p>

          <div className="mt-7 flex w-full max-w-xs flex-col items-stretch gap-3 sm:mt-8 sm:max-w-none sm:flex-row sm:items-center sm:justify-center lg:justify-start">
            <a href="#events" className="btn-solid">
              <span>進行中の企画・イベント</span>
            </a>
            <a href="#join" className="btn-ghost">
              <span>企画を持ち込む →</span>
            </a>
          </div>
        </div>

        <div className="hero-media relative w-full overflow-hidden bg-[#141414]">
          <Image
            src={activity.imageUrl}
            alt={activity.title}
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover object-center brightness-90 transition-transform duration-700 hover:scale-105"
            priority
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#080808]/40 via-transparent to-[#080808]/65 lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-[#080808]/20" />
          <div className="pointer-events-none absolute inset-x-4 top-[26%] text-center sm:inset-x-6 sm:top-[28%] lg:inset-x-8 lg:top-auto lg:bottom-8 lg:text-left">
            <p className="font-mono text-[clamp(1.45rem,5vw,4.25rem)] font-medium leading-[0.9] tracking-[-0.05em] text-[#f0ede8] drop-shadow-[0_3px_18px_rgba(0,0,0,0.72)]">
              THIS WAY.
              <br />
              <span className="text-[#c8a45a]">TOGETHER.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
