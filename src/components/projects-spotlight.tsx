import Image from 'next/image';
import { Project } from '@/types';
import { ArrowRight } from 'lucide-react';

interface InitiativeFormatsProps {
  series: Project[];
}

export function ProjectsSpotlight({ series }: InitiativeFormatsProps) {
  return (
    <section id="series" className="border-b border-[rgba(240,237,232,0.08)] bg-[#080808] py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="sec-eyebrow">03 / INITIATIVE FORMATS</div>
        <h2 className="sec-title text-[#f0ede8]">どんな活動・企画があるのか</h2>
        <p className="mt-4 max-w-2xl font-sans text-sm font-light leading-relaxed text-[rgba(240,237,232,0.7)] sm:text-base">
          AIに関する人たちがそれぞれの興味や強みを持ち寄り、実際に立ち上げている企画フォーマット。ジャンルは自由です。
        </p>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {series.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[rgba(240,237,232,0.08)] bg-[#0e0e0e] transition hover:border-[rgba(200,164,90,0.3)]"
            >
              <div>
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="rounded bg-[#080808]/85 px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-[#c8a45a] backdrop-blur-md">
                      ACTIVE FORMAT
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="font-mono text-[11px] text-[rgba(200,164,90,0.8)]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <h3 className="mt-2.5 font-sans text-xl font-normal text-[#f0ede8]">
                    {item.title}
                  </h3>

                  <p className="mt-2.5 font-sans text-xs font-light leading-relaxed text-[rgba(240,237,232,0.7)]">
                    {item.summary}
                  </p>
                </div>
              </div>

              <div className="border-t border-[rgba(240,237,232,0.08)] p-4 px-6">
                <a
                  href="#events"
                  className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold tracking-wider text-[#c8a45a] hover:underline"
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
