import { Navbar } from '@/components/navbar';
import { Hero } from '@/components/hero';
import { WhoWeAre } from '@/components/who-we-are';
import { PhilosophySteps } from '@/components/philosophy-steps';
import { UpcomingEvents } from '@/components/upcoming-events';
import { RecentLog } from '@/components/recent-log';
import { TeamMembers } from '@/components/team-members';
import { JoinSection } from '@/components/join-section';
import { OperatingGuidelines } from '@/components/operating-guidelines';
import { Footer } from '@/components/footer';
import {
  mockHeroActivity,
  mockRecentActivities,
  mockAllActivities,
  mockPeople,
} from '@/data/mock';
import { getPublicProposals, type PublicProposal } from '@/lib/proposals/public';
import type { Activity } from '@/types';

export const dynamic = 'force-dynamic';

// proposalsテーブルに画像を保存する列が無いため、既存の見本用の写真素材を
// 企画の並び順にそのまま割り当てる(企画ごとの画像アップロードは未実装)。
const FALLBACK_IMAGES = [
  '/images/japanese/seminar.png',
  '/images/japanese/workshop.png',
  '/images/japanese/development.png',
  '/images/japanese/meetup.png',
];

function formatDisplayDate(iso: string | null): string {
  if (!iso) return '日程調整中';
  return new Date(iso).toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toActivity(p: PublicProposal, index: number): Activity {
  return {
    id: p.id,
    title: p.title,
    summary: p.summary,
    category: 'EVENT',
    tags: [],
    status: 'UPCOMING',
    date: p.tentative_starts_at ?? p.published_at ?? new Date().toISOString(),
    displayDate: formatDisplayDate(p.tentative_starts_at),
    imageUrl: FALLBACK_IMAGES[index % FALLBACK_IMAGES.length],
    actionUrl: `/events/${p.slug}`,
    actionLabel: '詳細を見る →',
  };
}

export default async function Home() {
  const proposals = await getPublicProposals();
  const upcomingActivities = proposals.map(toActivity);

  return (
    <div className="min-h-screen bg-[#080808] text-[#f0ede8] selection:bg-[#c8a45a] selection:text-[#080808]">
      <Navbar />
      <main>
        <Hero activity={mockHeroActivity} />
        <WhoWeAre />
        <PhilosophySteps />
        {upcomingActivities.length > 0 && <UpcomingEvents activities={upcomingActivities} />}
        <RecentLog activities={mockRecentActivities} people={mockPeople} />
        <TeamMembers people={mockPeople} activities={mockAllActivities} />
        <JoinSection />
        <OperatingGuidelines />
      </main>
      <Footer />
    </div>
  );
}
