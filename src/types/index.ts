export type ActivityStatus = 'UPCOMING' | 'ACTIVE' | 'PLANNING' | 'RECRUITING' | 'COMPLETED';

export type Category = 'EVENT' | 'PROJECT' | 'ACTIVITY' | 'PEOPLE' | 'ARCHIVE' | 'ABOUT';

export type Tag =
  | 'AI'
  | 'LLM'
  | 'PROTOTYPE'
  | 'CREATIVE'
  | 'DEVELOPMENT'
  | 'COMMUNITY'
  | 'HACKATHON'
  | 'EDUCATION'
  | 'LOCAL';

export interface Person {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  activityIds: string[];
}

export interface Activity {
  id: string;
  title: string;
  summary: string;
  category: Category;
  tags: Tag[];
  status: ActivityStatus;
  date: string;
  displayDate: string;
  imageUrl: string;
  location?: string;
  spots?: string;
  participantCount?: number;
  partnerIds?: string[];
  actionUrl?: string;
  actionLabel?: string;
  isHero?: boolean;
}
