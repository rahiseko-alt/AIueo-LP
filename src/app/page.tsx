import { Navbar } from '@/components/navbar';
import { Hero } from '@/components/hero';
import { NextEvents } from '@/components/next-events';
import { Projects } from '@/components/projects';
import { RecentActivities } from '@/components/recent-activities';
import { People } from '@/components/people';
import { Join } from '@/components/join';
import { Archive } from '@/components/archive';
import { About } from '@/components/about';
import { Footer } from '@/components/footer';
import {
  mockHeroActivity,
  mockNextActivities,
  mockProjects,
  mockRecentActivities,
  mockPeople,
} from '@/data/mock';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white dark:bg-zinc-950 dark:text-zinc-50 dark:selection:bg-white dark:selection:text-zinc-950">
      <Navbar />
      <main id="hero">
        <Hero activity={mockHeroActivity} />
        <NextEvents activities={mockNextActivities} />
        <Projects projects={mockProjects} />
        <RecentActivities activities={mockRecentActivities} people={mockPeople} />
        <People people={mockPeople} activities={mockRecentActivities} />
        <Join />
        <Archive />
        <About />
      </main>
      <Footer />
    </div>
  );
}
