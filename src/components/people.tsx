import Image from 'next/image';
import { Person, Activity } from '@/types';

interface PeopleProps {
  people: Person[];
  activities: Activity[];
}

export function People({ people, activities }: PeopleProps) {
  const getActivityTitle = (actId: string) => {
    return activities.find((a) => a.id === actId)?.title || '共同プロジェクト';
  };

  return (
    <section id="people" className="border-b border-zinc-200 py-16 dark:border-zinc-800">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="font-mono text-xs font-semibold uppercase tracking-widest text-zinc-500">
              08 / Network
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
              PEOPLE & COLLABORATORS
            </h2>
          </div>
          <span className="font-mono text-xs text-zinc-500">WITH</span>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {people.map((person) => (
            <div
              key={person.id}
              className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/30"
            >
              <div>
                <div className="flex items-center gap-4">
                  {person.avatarUrl && (
                    <div className="relative h-14 w-14 overflow-hidden rounded-full border border-zinc-200 dark:border-zinc-700">
                      <Image
                        src={person.avatarUrl}
                        alt={person.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-zinc-950 dark:text-white">
                      {person.name}
                    </h3>
                    <p className="font-mono text-xs text-zinc-500">{person.role}</p>
                  </div>
                </div>

                <div className="mt-6 border-t border-zinc-100 pt-4 dark:border-zinc-800/60">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                    Collaborated on:
                  </span>
                  <ul className="mt-2 space-y-1.5 font-sans text-xs text-zinc-600 dark:text-zinc-400">
                    {person.activityIds.map((actId) => (
                      <li key={actId} className="line-clamp-1">
                        → {getActivityTitle(actId)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
