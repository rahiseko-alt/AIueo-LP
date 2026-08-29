import Image from 'next/image';
import { Activity } from '@/types';
import { MapPin, Users } from 'lucide-react';

interface UpcomingEventsProps {
  activities: Activity[];
}

export function UpcomingEvents({ activities }: UpcomingEventsProps) {
  return (
    <section id="events" className="border-b border-[rgba(240,237,232,0.08)] bg-[#080808] py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        {/* Header */}
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[rgba(240,237,232,0.08)] pb-6">
          <div>
            <div className="sec-eyebrow">02 / CALENDAR & MEETUPS</div>
            <h2 className="sec-title text-[#f0ede8]">Upcoming Events</h2>
          </div>
          <a href="#join" className="btn-ghost">
            View All Schedule →
          </a>
        </div>

        {/* 4-column Grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {activities.map((act) => (
            <div
              key={act.id}
              className="group flex flex-col justify-between overflow-hidden rounded-xl border border-[rgba(240,237,232,0.08)] bg-[#0e0e0e] transition-all duration-300 hover:-translate-y-2 hover:border-[rgba(200,164,90,0.4)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
            >
              {/* Thumbnail with Date Badge */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#141414]">
                <Image
                  src={act.imageUrl}
                  alt={act.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-transparent to-transparent opacity-80" />

                {/* Date Badge */}
                <div className="absolute top-3 left-3 rounded border border-[rgba(240,237,232,0.15)] bg-[rgba(8,8,8,0.85)] px-2.5 py-1 text-center backdrop-blur-md">
                  <span className="font-mono text-xs font-semibold tracking-wider text-[#c8a45a]">
                    {act.displayDate}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <div className="flex flex-wrap gap-1.5">
                    {act.tags.map((tag) => (
                      <span
                        key={tag}
                        className="font-mono text-[10px] uppercase tracking-wider text-[#c8a45a]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <h3 className="mt-2.5 font-sans text-base font-medium text-[#f0ede8] transition-colors group-hover:text-white">
                    {act.title}
                  </h3>

                  <p className="mt-2 line-clamp-2 font-sans text-xs font-light leading-relaxed text-[rgba(240,237,232,0.65)]">
                    {act.summary}
                  </p>
                </div>

                <div className="mt-6 border-t border-[rgba(240,237,232,0.08)] pt-4">
                  <div className="flex items-center justify-between text-xs">
                    {act.location && (
                      <span className="flex items-center gap-1 font-mono text-[11px] text-[rgba(240,237,232,0.5)]">
                        <MapPin className="h-3 w-3 text-[#c8a45a]" />
                        {act.location}
                      </span>
                    )}
                    {act.spots && (
                      <span className="font-mono text-[11px] text-[#c8a45a]">
                        {act.spots}
                      </span>
                    )}
                  </div>

                  <a
                    href={act.actionUrl || '#join'}
                    className="mt-3 block w-full rounded border border-[rgba(240,237,232,0.15)] bg-transparent py-2 text-center font-mono text-[11px] font-medium tracking-wider text-[#f0ede8] uppercase transition-all duration-200 hover:border-[#c8a45a] hover:bg-[#c8a45a] hover:text-[#080808]"
                  >
                    {act.actionLabel || '参加エントリー'}
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
