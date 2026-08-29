import Image from 'next/image';
import { Activity } from '@/types';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';

interface HeroProps {
  activity: Activity;
}

export function Hero({ activity }: HeroProps) {
  return (
    <section className="relative w-full border-b border-zinc-200 py-12 md:py-20 dark:border-zinc-800">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          Featured Activity
        </div>

        <div className="mt-4 grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <div className="flex flex-wrap gap-2">
              {activity.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-zinc-100 px-3 py-1 font-mono text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl dark:text-white">
              {activity.title}
            </h1>

            <p className="mt-4 text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400">
              {activity.summary}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <div className="flex items-center gap-1.5 font-mono">
                <Calendar className="h-4 w-4 text-zinc-500" />
                <span>{activity.displayDate}</span>
              </div>
              {activity.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-zinc-500" />
                  <span>{activity.location}</span>
                </div>
              )}
            </div>

            <div className="mt-8 flex items-center gap-4">
              <a
                href={activity.actionUrl || '#join'}
                className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                <span>{activity.actionLabel || '参加する'}</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="relative aspect-video overflow-hidden rounded-2xl border border-zinc-200 shadow-lg lg:col-span-5 dark:border-zinc-800">
            <Image
              src={activity.imageUrl}
              alt={activity.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
