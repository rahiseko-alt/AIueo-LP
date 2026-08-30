import Image from 'next/image';
import { Person, Activity } from '@/types';

interface TeamMembersProps {
  people: Person[];
  activities: Activity[];
}

export function TeamMembers({ people, activities }: TeamMembersProps) {
  const getActivityTitle = (actId: string) => {
    return activities.find((a) => a.id === actId)?.title || 'AI Sprint / Workshop';
  };

  return (
    <section id="team" className="section-padding border-b border-[rgba(240,237,232,0.08)] bg-[#080808]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
        <div className="sec-eyebrow">04 / LEAGUE PLAYERS</div>
        <h2 className="sec-title text-[#f0ede8]">Who Joins Us</h2>
        <p className="mt-3 sm:mt-4 max-w-2xl font-sans text-xs sm:text-sm md:text-base font-light leading-relaxed text-[rgba(240,237,232,0.75)]">
          肩書ではなく、一緒に何を作ったかでつながる草AIチームのメンバーとコラボレーター。
        </p>

        <div className="mt-10 sm:mt-12 md:mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {people.map((person) => (
            <div
              key={person.id}
              className="group flex flex-col justify-between overflow-hidden rounded-xl border border-[rgba(240,237,232,0.08)] bg-[#0e0e0e] transition-all duration-300 hover:-translate-y-1.5 hover:border-[rgba(200,164,90,0.4)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
            >
              <div>
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#141414]">
                  <Image
                    src={person.avatarUrl}
                    alt={person.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover grayscale transition duration-500 group-hover:grayscale-0 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-transparent to-transparent" />
                </div>

                <div className="p-5 sm:p-6">
                  <div className="font-mono text-[10px] font-semibold tracking-widest text-[#c8a45a] uppercase">
                    {person.role}
                  </div>
                  <h3 className="mt-1 font-sans text-base sm:text-lg font-medium text-[#f0ede8] group-hover:text-white transition-colors">
                    {person.name}
                  </h3>

                  <div className="mt-5 border-t border-[rgba(240,237,232,0.08)] pt-4">
                    <span className="font-mono text-[10px] tracking-wider text-[rgba(240,237,232,0.45)] uppercase">
                      Collaborated on:
                    </span>
                    <ul className="mt-2 space-y-1.5 font-sans text-xs text-[rgba(240,237,232,0.7)]">
                      {person.activityIds.map((actId) => (
                        <li key={actId} className="line-clamp-1">
                          → {getActivityTitle(actId)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
