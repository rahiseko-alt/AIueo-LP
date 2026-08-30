import Image from 'next/image';
import { Project } from '@/types';
import { ArrowRight } from 'lucide-react';

interface InitiativeFormatsProps {
  series: Project[];
}

export function ProjectsSpotlight({ series }: InitiativeFormatsProps) {
  return (
    <section id="series" className="section-padding border-b border-[rgba(240,237,232,0.08)] bg-[#080808]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
        <div className="sec-eyebrow">03 / INITIATIVE FORMATS</div>
        <h2 className="sec-title text-[#f0ede8]">どんな活動・企画があるのか</h2>
        <p className="mt-3 sm:mt-4 max-w-2xl font-sans text-xs sm:text-sm md:text-base font-light leading-relaxed text-[rgba(240,237,232,0.75)]">
          AIに関する人たちがそれぞれの興味や強みを持ち寄り、実際に立ち上げている企画フォーマット。ジャンルは自由です。
        </p>

        <div className="mt-10 sm:mt-12 md:mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {series.map((item, idx) => (
            <div
              key={item.id}
              className={`group flex flex-col justify-between overflow-hidden rounded-2xl border border-[rgba(240,237,232,0.08)] bg-[#0e0e0e] transition-all duration-300 hover:-translate-y-1.5 hover:border-[rgba(200,164,90,0.4)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] ${
                idx === 2 ? 'sm:col-span-2 lg:col-span-1' : ''
              }`}
            >
              <div>
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#141414]">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="rounded bg-[#080808]/85 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wider text-[#c8a45a] backdrop-blur-md">
                      ACTIVE FORMAT
                    </span>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="font-mono text-[11px] text-[rgba(200,164,90,0.85)]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <h3 className="mt-2.5 font-sans text-lg sm:text-xl font-medium text-[#f0ede8] group-hover:text-white transition-colors">
                    {item.title}
                  </h3>

                  <p className="mt-2 font-sans text-xs sm:text-sm font-light leading-relaxed text-[rgba(240,237,232,0.7)]">
                    {item.summary}
                  </p>
                </div>
              </div>

              <div className="border-t border-[rgba(240,237,232,0.08)] px-5 sm:px-6 py-3">
                <a
                  href="#events"
                  className="flex min-h-[44px] items-center gap-1.5 font-mono text-xs font-semibold tracking-wider text-[#c8a45a] transition-all hover:translate-x-1 hover:underline"
                >
                  <span>企画の動きを見る</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
