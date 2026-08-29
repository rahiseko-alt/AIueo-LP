import { Activity, Person, Project, Testimonial } from '@/types';

export const mockLeagueInfo = {
  name: 'AI League AIueo',
  tagline: 'Movement × Experiment × Community',
  subheading: 'AI同盟 / 草AIチーム — 週末に集まり、AIを触り、プロトタイプで遊ぶ同盟。',
  location: 'Tokyo / Online · Est. 2026',
};

export const mockPeople: Person[] = [
  {
    id: 'person-1',
    name: 'Kouhei Kosehira',
    role: 'League Captain / Organizer',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    activityIds: ['act-hero', 'act-next-1', 'act-1'],
  },
  {
    id: 'person-2',
    name: 'Taro Yamada',
    role: 'Lead AI Engineer / Builder',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    activityIds: ['act-next-2', 'act-2', 'act-3'],
  },
  {
    id: 'person-3',
    name: 'Misaki Sato',
    role: 'Prompt Designer & UI/UX',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    activityIds: ['act-hero', 'act-next-1', 'act-1'],
  },
  {
    id: 'person-4',
    name: 'Kenichi Suzuki',
    role: 'Agentic Architect / Member',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    activityIds: ['act-next-2', 'act-2'],
  },
];

export const mockHeroActivity: Activity = {
  id: 'act-hero',
  title: 'AI Sprint #04 — 現場のプロトタイプ実装ナイト',
  summary: '次世代エージェントとUIを掛け合わせた実践スプリント。草野球のようにみんなで集まって1日で動くモックを作る現場。',
  category: 'EVENT',
  tags: ['AI', 'PROTOTYPE', 'DEVELOPMENT'],
  status: 'UPCOMING',
  date: '2026-09-20',
  displayDate: '2026.09.20 SAT',
  imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
  location: 'Tokyo Shibuya / Hybrid',
  spots: '残り 4 枠',
  actionUrl: '#join',
  actionLabel: '参加エントリー →',
  isHero: true,
};

export const mockSliderPhotos = [
  {
    url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1000&auto=format&fit=crop&q=80',
    caption: '週末のAIハッカソン風景',
  },
  {
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&auto=format&fit=crop&q=80',
    caption: 'プロトタイプ実装セッション',
  },
  {
    url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1000&auto=format&fit=crop&q=80',
    caption: 'AI同盟 Meetup #03',
  },
  {
    url: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1000&auto=format&fit=crop&q=80',
    caption: '草AIチームのディスカッション',
  },
];

export const mockUpcomingActivities: Activity[] = [
  {
    id: 'act-next-1',
    title: 'Local LLM & Agent Hackday 2026',
    summary: 'ローカルLLMと自律エージェントを組み合わせて実践ツールを爆速構築する草ハッカソン。',
    category: 'EVENT',
    tags: ['LLM', 'AI', 'DEVELOPMENT'],
    status: 'UPCOMING',
    date: '2026-10-04',
    displayDate: '10.04',
    imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
    location: 'Shibuya Lab',
    spots: '12 / 16 参加中',
    actionUrl: '#join',
    actionLabel: '参加する',
  },
  {
    id: 'act-next-2',
    title: 'Creative Prompt Meetup #12',
    summary: '画像生成・動画生成・UI生成の実験コードとプロンプトを持ち寄り共有するナイト。',
    category: 'EVENT',
    tags: ['CREATIVE', 'PROTOTYPE', 'COMMUNITY'],
    status: 'UPCOMING',
    date: '2026-10-18',
    displayDate: '10.18',
    imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=80',
    location: 'Online Discord',
    spots: '自由参加',
    actionUrl: '#join',
    actionLabel: '参加する',
  },
  {
    id: 'act-next-3',
    title: 'AIueo 草プロトタイピング朝活 #24',
    summary: '土曜の朝に1時間だけ集まり、今週リリースされたAIツールを試して発表する定期会。',
    category: 'EVENT',
    tags: ['COMMUNITY', 'PROTOTYPE'],
    status: 'UPCOMING',
    date: '2026-10-24',
    displayDate: '10.24',
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
    location: 'Online',
    spots: '残り 8 枠',
    actionUrl: '#join',
    actionLabel: '参加する',
  },
  {
    id: 'act-next-4',
    title: 'AI同盟 秋の合宿実験キャンプ',
    summary: '1泊2日でAIを使ったプロダクトをゼロから完成まで作り切る草チーム合宿。',
    category: 'EVENT',
    tags: ['HACKATHON', 'DEVELOPMENT', 'AI'],
    status: 'UPCOMING',
    date: '2026-11-07',
    displayDate: '11.07',
    imageUrl: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&auto=format&fit=crop&q=80',
    location: 'Kamakura Studio',
    spots: '選考制 (8名限定)',
    actionUrl: '#join',
    actionLabel: 'エントリー',
  },
];

export const mockProjects: Project[] = [
  {
    id: 'proj-1',
    title: 'オープンエージェント・ラボ',
    summary: '最新のマルチエージェントフレームワークを検証し、実務で動くオープンソース成果物を継続公開する部活動。',
    status: 'ACTIVE',
    tags: ['DEVELOPMENT', 'LLM', 'AI'],
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    partnerIds: ['person-1', 'person-2'],
    actionUrl: '#join',
  },
  {
    id: 'proj-2',
    title: '草AI UIキット「AIueo-Components」',
    summary: 'AIチャットやGenerative UIを爆速で組むための軽量TypeScript/Tailwindコンポーネント集。',
    status: 'ACTIVE',
    tags: ['PROTOTYPE', 'CREATIVE', 'DEVELOPMENT'],
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
    partnerIds: ['person-3', 'person-4'],
    actionUrl: '#join',
  },
];

export const mockRecentActivities: Activity[] = [
  {
    id: 'act-1',
    title: 'Generative UI 実践ワークショップ',
    summary: 'AIが動的にReact UIをレンダリングする実験プロトタイプを参加者全員で構築。',
    category: 'ACTIVITY',
    tags: ['CREATIVE', 'AI'],
    status: 'COMPLETED',
    date: '2026-08-15',
    displayDate: '2026.08.15',
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
    participantCount: 22,
    partnerIds: ['person-1', 'person-3'],
  },
  {
    id: 'act-2',
    title: 'AI同盟 Meetup #03 — 自作AIツール披露会',
    summary: '各自が個人的に作った草AIツールを持ち寄り、LTとフィードバックを実施。',
    category: 'EVENT',
    tags: ['COMMUNITY', 'PROTOTYPE'],
    status: 'COMPLETED',
    date: '2026-07-28',
    displayDate: '2026.07.28',
    imageUrl: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&auto=format&fit=crop&q=80',
    participantCount: 35,
    partnerIds: ['person-2', 'person-4'],
  },
  {
    id: 'act-3',
    title: 'プロンプト検証合宿 2026 夏',
    summary: '週末の2日間で100パターンの推論プロンプトをベンチマーク比較。',
    category: 'PROJECT',
    tags: ['DEVELOPMENT', 'LLM'],
    status: 'COMPLETED',
    date: '2026-06-10',
    displayDate: '2026.06.10',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
    participantCount: 14,
    partnerIds: ['person-2'],
  },
];

export const mockTestimonials: Testimonial[] = [
  {
    id: 't-1',
    quote: '「ただの勉強会や営業交流会と違って、草野球みたいに気楽に集まって1つの動くプロトタイプを作れるのが最高に楽しい。」',
    author: 'T. Y.',
    role: 'Engineer / League Member',
    activityName: 'AI Sprint #03',
  },
  {
    id: 't-2',
    quote: '「0は何個集めても0。でもここで1回一緒に作ると、次の企画やプロジェクトが自然と生まれるのが実感できる。」',
    author: 'M. S.',
    role: 'Designer / Collaborator',
    activityName: 'Generative UI Workshop',
  },
  {
    id: 't-3',
    quote: '「名刺交換で終わらない、本当に何かを作って遊ぶ仲間が見つかる場所。」',
    author: 'K. S.',
    role: 'Builder / Participant',
    activityName: 'AI Hackday',
  },
];
