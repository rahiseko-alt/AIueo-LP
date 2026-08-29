import Image from 'next/image';
import { Activity } from '@/types';
import { Calendar, ArrowUpRight } from 'lucide-react';

interface NextEventsProps {
  activities: Activity[];
}

export function NextEvents({ activities }: NextEventsProps) {
  return (
    <section id="next" className="border-b border-zinc-200 py-16 dark:border-zinc-800">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="font-mono text-xs font-semibold uppercase tracking-widest text-zinc-500">
              02 / Upcoming
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
              NEXT ACTIVITIES
            </h2>
          </div>
          <span className="font-mono text-xs text-zinc-500">
            {activities.length} UPCOMING
          </span>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <Image
                  src={activity.imageUrl}
                  alt={activity.title}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 rounded-md bg-zinc-950/80 px-2.5 py-1 font-mono text-xs font-semibold text-white backdrop-blur-sm">
                  {activity.displayDate}
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-6">
                <div>
                  <div className="flex flex-wrap gap-2">
                    {activity.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-zinc-950 group-hover:text-zinc-700 dark:text-white dark:group-hover:text-zinc-200">
                    {activity.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {activity.summary}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800/80">
                  <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{activity.displayDate}</span>
                  </div>
                  <a
                    href={activity.actionUrl || '#join'}
                    className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
                  >
                    <span>{activity.actionLabel || '参加する'}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
