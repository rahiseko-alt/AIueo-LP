import Image from 'next/image';
import { Activity } from '@/types';

interface HeroProps {
  activity: Activity;
}

export function Hero({ activity }: HeroProps) {
  return (
    <section id="home" className="relative pt-16 md:pt-[68px]">
      <div className="hero-split border-b border-[rgba(240,237,232,0.08)] bg-[#080808]">
        {/* Left: Huge 3-line Typography & Punchy Motto */}
        <div className="flex flex-col items-center justify-center px-4 py-10 sm:px-8 sm:py-14 md:px-12 md:py-16 text-center">
          <div className="mb-6 inline-flex min-w-0 max-w-full items-center gap-2 rounded-full border border-[rgba(200,164,90,0.35)] bg-[rgba(200,164,90,0.08)] px-3.5 py-1.5 font-mono text-[10px] sm:text-[11px] font-medium tracking-[0.18em] sm:tracking-[0.22em] text-[#c8a45a] uppercase">
            <span className="h-1.5 w-1.5 flex-shrink-0 animate-ping rounded-full bg-[#c8a45a]"></span>
            <span className="min-w-0 truncate">AI League · Grassroots Action Alliance</span>
          </div>

          <h1 className="font-sans text-3xl font-light tracking-tight text-[#f0ede8] sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl">
            Initiative
            <span className="my-0.5 sm:my-1 block font-mono text-xl font-extralight text-[#c8a45a]/70 sm:text-2xl md:text-3xl">×</span>
            Co-Creation
            <span className="my-0.5 sm:my-1 block font-mono text-xl font-extralight text-[#c8a45a]/70 sm:text-2xl md:text-3xl">×</span>
            Alliance
          </h1>

          <div className="mt-6 sm:mt-8 w-full max-w-lg rounded-xl border border-[rgba(200,164,90,0.25)] bg-[rgba(200,164,90,0.04)] p-4 sm:p-5 text-left backdrop-blur-sm">
            <p className="font-mono text-xs text-[rgba(240,237,232,0.5)] line-through">
              「今度一緒になにかできたらいいですね」
            </p>
            <p className="mt-1 font-sans text-xs sm:text-sm md:text-base font-medium text-[#c8a45a] leading-relaxed">
              ↓ <br />
              「こういうのやるんですけど、一緒にどうですか？」に変える場。
            </p>
          </div>

          <p className="mt-4 max-w-md font-sans text-xs sm:text-sm font-light leading-relaxed text-[rgba(240,237,232,0.75)]">
            主婦向けセミナー、子ども向けAI教室、受託開発、LT会など、ジャンル問わず「やりたい企画」を形にする草AI同盟。
          </p>

          <div className="mt-6 sm:mt-8 flex w-full max-w-xs sm:max-w-none flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
            <a href="#events" className="btn-solid">
              <span>進行中の企画・イベント</span>
            </a>
            <a href="#join" className="btn-ghost">
              <span>企画を持ち込む →</span>
            </a>
          </div>
        </div>

        {/* Right: Full-height Hero Photo */}
        <div className="relative min-h-[340px] sm:min-h-[420px] md:min-h-[500px] lg:min-h-[620px] w-full overflow-hidden bg-[#141414]">
          <Image
            src={activity.imageUrl}
            alt={activity.title}
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover object-center brightness-90 transition-transform duration-700 hover:scale-105"
            priority
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#080808] lg:via-transparent lg:to-transparent" />

          {/* Featured Initiative Badge */}
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 lg:left-auto lg:right-8 lg:bottom-8 lg:max-w-md rounded-xl border border-[rgba(240,237,232,0.12)] bg-[rgba(8,8,8,0.9)] p-4 sm:p-5 backdrop-blur-md shadow-2xl">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] font-semibold tracking-widest text-[#c8a45a] uppercase">
                FEATURED INITIATIVE
              </span>
              <span className="font-mono text-[11px] text-[rgba(240,237,232,0.7)] truncate">
                {activity.spots}
              </span>
            </div>
            <h3 className="mt-2 font-sans text-sm sm:text-base font-medium text-[#f0ede8] line-clamp-2">
              {activity.title}
            </h3>
            <p className="mt-1.5 line-clamp-2 font-sans text-xs font-light text-[rgba(240,237,232,0.7)] leading-relaxed">
              {activity.summary}
            </p>
            <div className="mt-3.5 flex items-center justify-between border-t border-[rgba(240,237,232,0.08)] pt-2.5">
              <span className="font-mono text-xs text-[#c8a45a]">{activity.location}</span>
              <a
                href={activity.actionUrl || '#events'}
                className="flex min-h-[44px] items-center font-mono text-xs font-semibold text-white underline underline-offset-4 transition-colors hover:text-[#c8a45a]"
              >
                企画一覧を見る →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
