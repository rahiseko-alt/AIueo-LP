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
  /**
   * 本人の紹介文。入っている場合はカード下部にこれを出し、
   * 「Collaborated on」の一覧は出さない（見本の活動名を本人の実績のように
   * 見せないため）。
   */
  bio?: string;
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
