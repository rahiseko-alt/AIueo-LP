import Image from 'next/image';
import { Activity } from '@/types';

interface HeroProps {
  activity: Activity;
}

export function Hero({ activity }: HeroProps) {
  return (
    <section id="home" className="relative h-[100svh] min-h-[30rem] overflow-hidden bg-[#080808] lg:min-h-[36rem]">
      <Image
        src={activity.imageUrl}
        alt="開放的なイベントスペースでAI研修を行う女性講師"
        fill
        sizes="100vw"
        className="object-cover object-[63%_center] brightness-[0.72] sm:object-[60%_center] sm:brightness-[0.8] lg:object-center"
        priority
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/65 via-black/15 to-black/60 sm:from-black/45 sm:via-black/5 sm:to-black/55" />
      <div className="pointer-events-none absolute left-5 top-[max(2rem,env(safe-area-inset-top))] text-left sm:left-8 sm:top-8 lg:left-[8%] lg:top-[10%]">
        <h1 className="font-mono text-[clamp(2.1rem,9vw,4.5rem)] font-medium leading-[0.88] tracking-[-0.06em] text-[#f0ede8] drop-shadow-[0_4px_22px_rgba(0,0,0,0.8)] lg:text-[clamp(4rem,6.7vw,6rem)]">
          THIS WAY.
          <br />
          <span className="text-[#c8a45a]">この指とまれ、</span>
        </h1>
      </div>

      <div
        aria-label="AIueo"
        className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 font-mono text-center text-[#f0ede8]/90 drop-shadow-[0_4px_28px_rgba(0,0,0,0.65)]"
      >
        <span className="text-[clamp(0.7rem,2.4vw,1.35rem)] font-medium tracking-[0.12em]">仲間を集めるサービス</span>
        <span className="flex items-center gap-[0.16em] text-[clamp(2.75rem,13vw,9rem)] font-semibold leading-none tracking-[-0.09em]">
          <span className="h-[0.16em] w-[0.16em] shrink-0 rounded-full bg-[#c8a45a] shadow-[0_0_18px_rgba(200,164,90,0.8)]" />
          <span>Aiueo</span>
        </span>
      </div>
    </section>
  );
}
