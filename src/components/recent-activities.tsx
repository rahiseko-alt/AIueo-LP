import Image from 'next/image';
import { Activity, Person } from '@/types';
import { Calendar, Users } from 'lucide-react';

interface RecentActivitiesProps {
  activities: Activity[];
  people: Person[];
}

export function RecentActivities({ activities, people }: RecentActivitiesProps) {
  const getPartnerNames = (partnerIds?: string[]) => {
    if (!partnerIds || partnerIds.length === 0) return null;
    return people
      .filter((p) => partnerIds.includes(p.id))
      .map((p) => p.name)
      .join(', ');
  };

  return (
    <section id="recent" className="border-b border-zinc-200 py-16 dark:border-zinc-800">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="font-mono text-xs font-semibold uppercase tracking-widest text-zinc-500">
              07 / Log
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
              RECENT ACTIVITIES
            </h2>
          </div>
          <span className="font-mono text-xs text-zinc-500">ARCHIVE LOG</span>
        </div>

        <div className="mt-8 space-y-6">
          {activities.map((activity) => {
            const partners = getPartnerNames(activity.partnerIds);
            return (
              <div
                key={activity.id}
                className="grid gap-6 rounded-xl border border-zinc-200 bg-white p-6 transition md:grid-cols-12 md:items-center dark:border-zinc-800 dark:bg-zinc-900/40"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-lg md:col-span-4">
                  <Image
                    src={activity.imageUrl}
                    alt={activity.title}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex flex-col justify-between md:col-span-8">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-zinc-500">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{activity.displayDate}</span>
                      </div>
                      {activity.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <h3 className="mt-2 text-xl font-bold text-zinc-950 dark:text-white">
                      {activity.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {activity.summary}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                    {activity.participantCount && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        <span>参加者: {activity.participantCount}名</span>
                      </div>
                    )}
                    {partners && (
                      <div className="font-medium text-zinc-700 dark:text-zinc-300">
                        with {partners}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
