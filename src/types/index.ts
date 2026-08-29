export type ActivityStatus = 'UPCOMING' | 'ACTIVE' | 'PLANNING' | 'RECRUITING' | 'COMPLETED';

export type Category = 'EVENT' | 'PROJECT' | 'ACTIVITY' | 'PEOPLE' | 'ARCHIVE' | 'ABOUT';

export type Tag = 'AI' | 'BUSINESS' | 'COMMUNITY' | 'EDUCATION' | 'DEVELOPMENT' | 'CREATIVE' | 'LOCAL';

export interface Person {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  links?: {
    twitter?: string;
    github?: string;
    website?: string;
  };
  activityIds: string[];
}

export interface Activity {
  id: string;
  title: string;
  summary: string;
  description?: string;
  category: Category;
  tags: Tag[];
  status: ActivityStatus;
  date: string; // ISO or YYYY.MM.DD
  displayDate: string; // e.g. "2026.09.20"
  imageUrl: string;
  location?: string;
  participantCount?: number;
  participants?: Person[];
  partnerIds?: string[];
  actionUrl?: string;
  actionLabel?: string;
  isHero?: boolean;
}

export interface Project {
  id: string;
  title: string;
  summary: string;
  status: 'ACTIVE' | 'PLANNING' | 'RECRUITING';
  tags: Tag[];
  imageUrl: string;
  partnerIds: string[];
  actionUrl?: string;
}
