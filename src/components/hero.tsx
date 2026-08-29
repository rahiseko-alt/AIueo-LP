import Image from 'next/image';
import { Activity } from '@/types';

interface HeroProps {
  activity: Activity;
}

export function Hero({ activity }: HeroProps) {
  return (
    <section id="home" className="relative pt-[68px]">
      <div className="hero-split border-b border-[rgba(240,237,232,0.08)] bg-[#080808]">
        {/* Left: Huge 3-line Typography */}
        <div className="flex flex-col items-center justify-center p-8 text-center sm:p-12 md:p-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(200,164,90,0.35)] bg-[rgba(200,164,90,0.08)] px-4 py-1 font-mono text-[11px] font-medium tracking-[0.24em] text-[#c8a45a] uppercase">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[#c8a45a]"></span>
            AI League · Grassroots AI Alliance
          </div>

          <h1 className="font-sans text-4xl font-light tracking-tight text-[#f0ede8] sm:text-5xl md:text-6xl lg:text-7xl">
            Experiment
            <span className="my-1 block text-2xl font-extralight text-[#c8a45a]/70 sm:my-2 sm:text-3xl">×</span>
            Build
            <span className="my-1 block text-2xl font-extralight text-[#c8a45a]/70 sm:my-2 sm:text-3xl">×</span>
            Community
          </h1>

          <p className="mt-8 max-w-md font-sans text-sm font-light leading-relaxed text-[rgba(240,237,232,0.7)] sm:text-base">
            草野球のように集まり、AIを触り、1日で動くプロトタイプを作る草AI同盟。
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a href="#events" className="btn-solid">
              Explore Events
            </a>
            <a href="#about" className="btn-ghost">
              About League →
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
          {/* Subtle dark gradient overlay to blend seamlessly */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent md:bg-gradient-to-r md:from-[#080808] md:via-transparent md:to-transparent" />

          {/* Featured Live Badge */}
          <div className="absolute bottom-6 left-6 right-6 rounded-xl border border-[rgba(240,237,232,0.12)] bg-[rgba(8,8,8,0.85)] p-5 backdrop-blur-md md:left-auto md:right-8 md:bottom-8 md:max-w-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-semibold tracking-widest text-[#c8a45a] uppercase">
                FEATURED SPRINT
              </span>
              <span className="font-mono text-xs text-[rgba(240,237,232,0.6)]">
                {activity.displayDate}
              </span>
            </div>
            <h3 className="mt-2 font-sans text-base font-medium text-[#f0ede8]">
              {activity.title}
            </h3>
            <div className="mt-4 flex items-center justify-between">
              <span className="font-mono text-xs text-[#c8a45a]">{activity.spots}</span>
              <a
                href={activity.actionUrl || '#join'}
                className="font-mono text-xs font-semibold text-white underline underline-offset-4 hover:text-[#c8a45a]"
              >
                {activity.actionLabel || '詳細を見る →'}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
