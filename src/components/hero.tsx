import Image from 'next/image';
import { Activity } from '@/types';
import { Sparkles, ArrowRight } from 'lucide-react';

interface HeroProps {
  activity: Activity;
}

export function Hero({ activity }: HeroProps) {
  return (
    <section id="home" className="relative pt-[68px]">
      <div className="hero-split border-b border-[rgba(240,237,232,0.08)] bg-[#080808]">
        {/* Left: Huge 3-line Typography & Punchy Motto */}
        <div className="flex flex-col items-center justify-center p-8 text-center sm:p-12 md:p-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(200,164,90,0.35)] bg-[rgba(200,164,90,0.08)] px-4 py-1 font-mono text-[11px] font-medium tracking-[0.24em] text-[#c8a45a] uppercase">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[#c8a45a]"></span>
            AI League · Grassroots Action Alliance
          </div>

          <h1 className="font-sans text-4xl font-light tracking-tight text-[#f0ede8] sm:text-5xl md:text-6xl lg:text-7xl">
            Initiative
            <span className="my-1 block text-2xl font-extralight text-[#c8a45a]/70 sm:my-2 sm:text-3xl">×</span>
            Co-Creation
            <span className="my-1 block text-2xl font-extralight text-[#c8a45a]/70 sm:my-2 sm:text-3xl">×</span>
            Alliance
          </h1>

          <div className="mt-8 max-w-lg rounded-xl border border-[rgba(200,164,90,0.25)] bg-[rgba(200,164,90,0.04)] p-4 text-left backdrop-blur-sm">
            <p className="font-mono text-xs text-[rgba(240,237,232,0.5)] line-through">
              「今度一緒になにかできたらいいですね」
            </p>
            <p className="mt-1 font-sans text-sm font-medium text-[#c8a45a] sm:text-base">
              ↓ <br />
              「こういうのやるんですけど、一緒にどうですか？」に変える場。
            </p>
          </div>

          <p className="mt-4 max-w-md font-sans text-xs font-light leading-relaxed text-[rgba(240,237,232,0.7)] sm:text-sm">
            主婦向けセミナー、子ども向けAI教室、受託開発、LT会など、ジャンル問わず「やりたい企画」を形にする草AI同盟。
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a href="#events" className="btn-solid">
              進行中の企画・イベント
            </a>
            <a href="#propose" className="btn-ghost">
              企画を持ち込む →
            </a>
          </div>
        </div>

        {/* Right: Full-height Hero Photo */}
        <div className="relative min-h-[360px] w-full overflow-hidden bg-[#141414] md:min-h-[600px]">
          <Image
            src={activity.imageUrl}
            alt={activity.title}
            fill
            className="object-cover object-center brightness-90 transition-transform duration-700 hover:scale-105"
            priority
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent md:bg-gradient-to-r md:from-[#080808] md:via-transparent md:to-transparent" />

          {/* Featured Initiative Badge */}
          <div className="absolute bottom-6 left-6 right-6 rounded-xl border border-[rgba(240,237,232,0.12)] bg-[rgba(8,8,8,0.88)] p-5 backdrop-blur-md md:left-auto md:right-8 md:bottom-8 md:max-w-md">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-semibold tracking-widest text-[#c8a45a] uppercase">
                FEATURED INITIATIVE
              </span>
              <span className="font-mono text-xs text-[rgba(240,237,232,0.7)]">
                {activity.spots}
              </span>
            </div>
            <h3 className="mt-2 font-sans text-base font-medium text-[#f0ede8]">
              {activity.title}
            </h3>
            <p className="mt-2 line-clamp-2 font-sans text-xs font-light text-[rgba(240,237,232,0.7)]">
              {activity.summary}
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-[rgba(240,237,232,0.08)] pt-3">
              <span className="font-mono text-xs text-[#c8a45a]">{activity.location}</span>
              <a
                href={activity.actionUrl || '#events'}
                className="font-mono text-xs font-semibold text-white underline underline-offset-4 hover:text-[#c8a45a]"
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
