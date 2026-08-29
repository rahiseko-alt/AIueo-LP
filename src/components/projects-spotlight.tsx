import Image from 'next/image';
import { Project } from '@/types';
import { Sparkles, ArrowRight } from 'lucide-react';

interface ProjectsSpotlightProps {
  projects: Project[];
}

export function ProjectsSpotlight({ projects }: ProjectsSpotlightProps) {
  return (
    <section id="projects" className="border-b border-[rgba(240,237,232,0.08)] bg-[#080808] py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="sec-eyebrow">03 / CONTINUOUS LABS</div>
        <h2 className="sec-title text-[#f0ede8]">Projects & Experiments</h2>
        <p className="mt-4 max-w-2xl font-sans text-sm font-light leading-relaxed text-[rgba(240,237,232,0.7)] sm:text-base">
          単発のイベントで終わらせず、継続して開発・検証を行う草AIラボと共同プロジェクト。
        </p>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[rgba(240,237,232,0.08)] bg-[#0e0e0e] transition hover:border-[rgba(200,164,90,0.3)]"
            >
              <div>
                <div className="relative aspect-[16/9] w-full overflow-hidden">
                  <Image
                    src={proj.imageUrl}
                    alt={proj.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="rounded bg-[#080808]/85 px-3 py-1 font-mono text-[10px] font-semibold tracking-wider text-[#c8a45a] backdrop-blur-md">
                      {proj.status}
                    </span>
                  </div>
                </div>

                <div className="p-8">
                  <div className="flex flex-wrap gap-2">
                    {proj.tags.map((tag) => (
                      <span
                        key={tag}
                        className="font-mono text-xs text-[rgba(200,164,90,0.8)]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <h3 className="mt-3 font-sans text-2xl font-normal text-[#f0ede8]">
                    {proj.title}
                  </h3>

                  <p className="mt-3 font-sans text-sm font-light leading-relaxed text-[rgba(240,237,232,0.7)]">
                    {proj.summary}
                  </p>
                </div>
              </div>

              <div className="border-t border-[rgba(240,237,232,0.08)] p-6 px-8">
                <a
                  href={proj.actionUrl || '#join'}
                  className="inline-flex items-center gap-2 font-mono text-xs font-semibold tracking-wider text-[#c8a45a] hover:underline"
                >
                  <span>プロジェクトに参加・合流する</span>
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
