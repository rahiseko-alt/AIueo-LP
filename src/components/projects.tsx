import Image from 'next/image';
import { Project } from '@/types';
import { Layers } from 'lucide-react';

interface ProjectsProps {
  projects: Project[];
}

export function Projects({ projects }: ProjectsProps) {
  return (
    <section id="projects" className="border-b border-zinc-200 py-16 dark:border-zinc-800">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="font-mono text-xs font-semibold uppercase tracking-widest text-zinc-500">
              03 / Now Running
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
              PROJECTS & LABS
            </h2>
          </div>
          <span className="font-mono text-xs text-zinc-500">CONTINUOUS</span>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 p-6 dark:border-zinc-800 dark:bg-zinc-900/30"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-zinc-500" />
                    <span
                      className={`font-mono text-[11px] font-bold tracking-wider px-2 py-0.5 rounded ${
                        project.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="font-mono text-[11px] text-zinc-500"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-lg">
                  <Image
                    src={project.imageUrl}
                    alt={project.title}
                    fill
                    className="object-cover"
                  />
                </div>

                <h3 className="mt-4 text-lg font-bold text-zinc-950 dark:text-white">
                  {project.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {project.summary}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-zinc-200/80 pt-4 dark:border-zinc-800">
                <a
                  href={project.actionUrl || '#join'}
                  className="font-mono text-xs font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
                >
                  プロジェクト詳細 / 参加 →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
