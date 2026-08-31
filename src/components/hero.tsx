import Image from 'next/image';
import { Activity } from '@/types';

interface HeroProps {
  activity: Activity;
}

export function Hero({ activity }: HeroProps) {
  return (
    <section id="home" className="relative h-[100svh] min-h-[36rem] overflow-hidden bg-[#080808]">
      <Image
        src={activity.imageUrl}
        alt="AI導入セミナーで実演する講師と参加者"
        fill
        sizes="100vw"
        className="object-cover object-[56%_center] brightness-[0.76] sm:object-[54%_center] sm:brightness-[0.82] lg:object-center"
        priority
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/65 via-black/15 to-black/60 sm:from-black/45 sm:via-black/5 sm:to-black/55" />
      <div className="pointer-events-none absolute inset-x-5 top-[max(1.25rem,env(safe-area-inset-top))] text-center sm:inset-x-8 sm:top-[8%] lg:left-[8%] lg:right-auto lg:top-auto lg:bottom-[12%] lg:text-left">
        <h1 className="font-mono text-[clamp(2.1rem,9vw,6rem)] font-medium leading-[0.88] tracking-[-0.06em] text-[#f0ede8] drop-shadow-[0_4px_22px_rgba(0,0,0,0.8)]">
          THIS WAY.
          <br />
          <span className="text-[#c8a45a]">TOGETHER.</span>
        </h1>
      </div>
    </section>
  );
}
