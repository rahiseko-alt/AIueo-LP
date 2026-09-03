import { Navbar } from '@/components/navbar';
import { Hero } from '@/components/hero';
import { WhoWeAre } from '@/components/who-we-are';
import { PhilosophySteps } from '@/components/philosophy-steps';
import { UpcomingEvents } from '@/components/upcoming-events';
import { ProjectsSpotlight } from '@/components/projects-spotlight';
import { RecentLog } from '@/components/recent-log';
import { TeamMembers } from '@/components/team-members';
import { Testimonials } from '@/components/testimonials';
import { JoinSection } from '@/components/join-section';
import { ArchiveTimeline } from '@/components/archive-timeline';
import { Footer } from '@/components/footer';
import {
  mockHeroActivity,
  mockUpcomingActivities,
  mockInitiativeFormats,
  mockRecentActivities,
  mockAllActivities,
  mockPeople,
} from '@/data/mock';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#080808] text-[#f0ede8] selection:bg-[#c8a45a] selection:text-[#080808]">
      <Navbar />
      <main>
        <Hero activity={mockHeroActivity} />
        <WhoWeAre />
        <PhilosophySteps />
        <UpcomingEvents activities={mockUpcomingActivities} />
        <ProjectsSpotlight series={mockInitiativeFormats} />
        <RecentLog activities={mockRecentActivities} people={mockPeople} />
        <TeamMembers people={mockPeople} activities={mockAllActivities} />
        <Testimonials />
        <JoinSection />
        <ArchiveTimeline />
      </main>
      <Footer />
    </div>
  );
}
