import Image from 'next/image';
import { Activity, Person } from '@/types';
import { Users } from 'lucide-react';

interface RecentLogProps {
  activities: Activity[];
  people: Person[];
}

export function RecentLog({ activities, people }: RecentLogProps) {
  const getPartnerNames = (partnerIds?: string[]) => {
    if (!partnerIds || partnerIds.length === 0) return null;
    return people
      .filter((p) => partnerIds.includes(p.id))
      .map((p) => p.name)
      .join(', ');
  };

  return (
    <section id="recent" className="section-padding border-b border-[rgba(240,237,232,0.08)] bg-[#080808]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-[rgba(240,237,232,0.08)] pb-6">
          <div>
            <div className="sec-eyebrow">04 / LOGS & WHAT WE DID</div>
            <h2 className="sec-title text-[#f0ede8]">Recent Activities</h2>
          </div>
          <span className="font-mono text-xs text-[rgba(240,237,232,0.5)] tracking-wider">
            ACTIVITY ARCHIVE
          </span>
        </div>

        {/* Editorial List Layout */}
        <div className="mt-8 divide-y divide-[rgba(240,237,232,0.08)]">
          {activities.map((act) => {
            const partners = getPartnerNames(act.partnerIds);
            return (
              <div
                key={act.id}
                className="group grid gap-4 sm:gap-6 py-6 sm:py-8 transition-colors hover:bg-[#0e0e0e]/50 md:grid-cols-12 md:items-center md:px-6 rounded-xl"
              >
                {/* Photo */}
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-[#141414] md:col-span-4">
                  <Image
                    src={act.imageUrl}
                    alt={act.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 35vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2 rounded bg-black/85 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#c8a45a] backdrop-blur-sm">
                    {act.displayDate}
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-col justify-between md:col-span-8">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      {act.tags.map((tag) => (
                        <span
                          key={tag}
                          className="font-mono text-[10px] sm:text-[11px] tracking-wider text-[#c8a45a]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <h3 className="mt-2 font-sans text-base sm:text-lg md:text-xl font-medium text-[#f0ede8] group-hover:text-white transition-colors">
                      {act.title}
                    </h3>

                    <p className="mt-2 font-sans text-xs sm:text-sm font-light leading-relaxed text-[rgba(240,237,232,0.75)]">
                      {act.summary}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 sm:gap-4 font-mono text-xs text-[rgba(240,237,232,0.5)]">
                    {act.participantCount && (
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-[#c8a45a]" />
                        <span>{act.participantCount} Participants</span>
                      </div>
                    )}
                    {partners && (
                      <div className="text-[rgba(240,237,232,0.85)]">
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
