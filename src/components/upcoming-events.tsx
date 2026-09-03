'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Activity, Tag } from '@/types';
import { MapPin } from 'lucide-react';

interface UpcomingEventsProps {
  activities: Activity[];
}

export function UpcomingEvents({ activities }: UpcomingEventsProps) {
  const [filter, setFilter] = useState<'ALL' | Tag>('ALL');

  const filterButtons: { label: string; val: 'ALL' | Tag }[] = [
    { label: 'ALL (すべて)', val: 'ALL' },
    { label: 'EDUCATION (主婦・教育)', val: 'EDUCATION' },
    { label: 'COMMUNITY (地域・子ども)', val: 'COMMUNITY' },
    { label: 'DEVELOPMENT (受託・開発)', val: 'DEVELOPMENT' },
    { label: 'CREATIVE (クリエイティブ)', val: 'CREATIVE' },
  ];

  const filteredActivities = filter === 'ALL'
    ? activities
    : activities.filter((act) => act.tags.includes(filter));

  return (
    <section id="events" className="section-padding border-b border-[rgba(240,237,232,0.08)] bg-[#080808]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-[rgba(240,237,232,0.08)] pb-6">
          <div>
            <div className="sec-eyebrow">02 / ACTIVE INITIATIVES & EVENTS</div>
            <h2 className="sec-title text-[#f0ede8]">「こういうのやります」進行中の企画</h2>
          </div>
          <span className="font-mono text-xs text-[#c8a45a] tracking-wider">
            {filteredActivities.length} ACTIVE PROJECTS / SESSIONS
          </span>
        </div>

        {/* Activity Filter Bar (Touch horizontal scroll on mobile, wrap on tablet/desktop) */}
        <div className="mt-6 sm:mt-8 flex gap-2 overflow-x-auto pb-2 sm:pb-0 sm:flex-wrap no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {filterButtons.map((btn) => (
            <button
              key={btn.val}
              onClick={() => setFilter(btn.val)}
              className={`flex min-h-[44px] flex-shrink-0 items-center justify-center rounded-full px-4 py-2 font-mono text-xs font-medium tracking-wider uppercase transition-all select-none ${
                filter === btn.val
                  ? 'border border-[#c8a45a] bg-[#c8a45a] text-[#080808] shadow-[0_0_16px_rgba(200,164,90,0.3)]'
                  : 'border border-[rgba(240,237,232,0.15)] bg-transparent text-[rgba(240,237,232,0.7)] hover:border-[#c8a45a] hover:text-[#c8a45a]'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="-mx-4 mt-8 overflow-x-auto px-4 pb-5 sm:-mx-6 sm:mt-10 sm:px-6 md:-mx-10 md:px-10 no-scrollbar">
          <div className="flex w-max snap-x snap-mandatory gap-4 sm:gap-5">
          {filteredActivities.map((act) => (
            <div
              key={act.id}
              className="group flex w-[82vw] max-w-[22rem] snap-start flex-col justify-between overflow-hidden rounded-xl border border-[rgba(240,237,232,0.08)] bg-[#0e0e0e] transition-all duration-300 hover:-translate-y-1.5 hover:border-[rgba(200,164,90,0.4)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.6)] sm:w-[22rem] lg:w-[24rem]"
            >
              {/* Thumbnail with Date Badge */}
              <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden bg-[#141414]">
                <Image
                  src={act.imageUrl}
                  alt={act.title}
                  fill
                  sizes="(max-width: 640px) 82vw, (max-width: 1024px) 22rem, 24rem"
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

                  <h3 className="mt-2.5 font-sans text-base font-medium text-[#f0ede8] transition-colors group-hover:text-white line-clamp-2">
                    {act.title}
                  </h3>

                  <p className="mt-2 line-clamp-3 font-sans text-xs font-light leading-relaxed text-[rgba(240,237,232,0.65)]">
                    {act.summary}
                  </p>
                </div>

                <div className="mt-6 border-t border-[rgba(240,237,232,0.08)] pt-4">
                  <div className="flex flex-col gap-1 text-xs">
                    {act.location && (
                      <span className="flex items-center gap-1 font-mono text-[11px] text-[rgba(240,237,232,0.5)]">
                        <MapPin className="h-3 w-3 text-[#c8a45a] flex-shrink-0" />
                        <span className="truncate">{act.location}</span>
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
                    className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded border border-[rgba(240,237,232,0.15)] bg-transparent py-2.5 text-center font-mono text-[11px] font-medium tracking-wider text-[#f0ede8] uppercase transition-all duration-200 hover:border-[#c8a45a] hover:bg-[#c8a45a] hover:text-[#080808]"
                  >
                    {act.actionLabel || '参加・合流する'}
                  </a>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
}
