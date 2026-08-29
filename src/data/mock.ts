import { Activity, Person, Project, Testimonial } from '@/types';

export const mockLeagueInfo = {
  name: 'AI League AIueo',
  tagline: 'Events × Experiences × Community',
  subheading: '草AIチーム / AI同盟 — 週末に集まり、AIを体験し、人とつながるイベントコミュニティ。',
  location: 'Tokyo · Shibuya / Roppongi / Online',
};

export const mockPeople: Person[] = [
  {
    id: 'person-1',
    name: 'Kouhei Kosehira',
    role: 'Organizer / Event Host',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    activityIds: ['act-hero', 'act-next-1', 'act-1'],
  },
  {
    id: 'person-2',
    name: 'Taro Yamada',
    role: 'Community Facilitator',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    activityIds: ['act-next-2', 'act-2', 'act-3'],
  },
  {
    id: 'person-3',
    name: 'Misaki Sato',
    role: 'Creative Workshop Lead',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    activityIds: ['act-hero', 'act-next-1', 'act-1'],
  },
  {
    id: 'person-4',
    name: 'Kenichi Suzuki',
    role: 'Social & Meetup Host',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    activityIds: ['act-next-2', 'act-2'],
  },
];

export const mockHeroActivity: Activity = {
  id: 'act-hero',
  title: 'AI Social Night #06 — 初めて触る人も歓迎のAI体験＆交流会',
  summary: 'お酒やコーヒーを片手に、最新AIツールの面白い使い方を持ち寄ってワイワイ試すカジュアルミートアップ。草野球の練習のように誰でもふらっと参加できるリアルイベント。',
  category: 'EVENT',
  tags: ['COMMUNITY', 'AI', 'CREATIVE'],
  status: 'UPCOMING',
  date: '2026-09-20',
  displayDate: '2026.09.20 SAT 18:30',
  imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&auto=format&fit=crop&q=80',
  location: 'Shibuya Lounge / Tokyo',
  spots: '残り 5 名 / 定員 25名',
  actionUrl: '#join',
  actionLabel: 'イベントに参加する →',
  isHero: true,
};

export const mockSliderPhotos = [
  {
    url: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1000&auto=format&fit=crop&q=80',
    caption: 'みんなでテーブルを囲むAIミートアップ',
  },
  {
    url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1000&auto=format&fit=crop&q=80',
    caption: 'ドリンクを片手に楽しむAIソーシャルナイト',
  },
  {
    url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1000&auto=format&fit=crop&q=80',
    caption: '週末のAIクリエイティブ体験ワークショップ',
  },
  {
    url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1000&auto=format&fit=crop&q=80',
    caption: 'カフェで集まるカジュアルもくもく会',
  },
];

export const mockUpcomingActivities: Activity[] = [
  {
    id: 'act-next-1',
    title: 'AI × Coffee 週末もくもく体験カフェ #14',
    summary: '週末の午前にカフェに集まり、気になっていたAIツールを各々試しながら教え合うゆるやかな朝活。',
    category: 'EVENT',
    tags: ['COMMUNITY', 'AI'],
    status: 'UPCOMING',
    date: '2026-10-04',
    displayDate: '10.04 SUN 10:30',
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
    location: 'Omotesando Cafe',
    spots: '8 / 12名 参加中',
    actionUrl: '#join',
    actionLabel: '参加エントリー',
  },
  {
    id: 'act-next-2',
    title: 'AI画像・動画クリエイティブ体験Night',
    summary: 'Midjourneyや動画生成AIを使って、みんなで面白いポスターやショート動画をその場で作って見せ合う企画。',
    category: 'EVENT',
    tags: ['CREATIVE', 'AI'],
    status: 'UPCOMING',
    date: '2026-10-18',
    displayDate: '10.18 SUN 17:00',
    imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=80',
    location: 'Shibuya Space',
    spots: '残り 6 名',
    actionUrl: '#join',
    actionLabel: '参加エントリー',
  },
  {
    id: 'act-next-3',
    title: 'AI Dinner & Talk — 美味しいご飯とAIの未来',
    summary: '少人数でテーブルを囲んで食事をしながら、最近のAIトレンドや活用アイデアを語り合うディナー会。',
    category: 'EVENT',
    tags: ['COMMUNITY'],
    status: 'UPCOMING',
    date: '2026-10-24',
    displayDate: '10.24 SAT 19:00',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
    location: 'Ebisu Restaurant',
    spots: '残り 3 席 (限定8名)',
    actionUrl: '#join',
    actionLabel: '席を予約する',
  },
  {
    id: 'act-next-4',
    title: '初心者大歓迎！ゼロから始めるAI活用ワークショップ',
    summary: '「AIって何から触ればいい？」という方向け。日常や仕事で明日から使えるAI活用術をハンズオンで学ぶ会。',
    category: 'EVENT',
    tags: ['COMMUNITY', 'AI'],
    status: 'UPCOMING',
    date: '2026-11-07',
    displayDate: '11.07 SAT 14:00',
    imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
    location: 'Roppongi Hub',
    spots: '18 / 20名',
    actionUrl: '#join',
    actionLabel: '参加エントリー',
  },
];

export const mockEventSeries: Project[] = [
  {
    id: 'series-1',
    title: 'AI Social Night (月例ソーシャル交流会)',
    summary: '毎月第3金曜に開催する看板イベント。お酒や軽食を楽しみながら、AIで遊んだ成果やおすすめツールを気楽にシェアする場。',
    status: 'ACTIVE',
    tags: ['COMMUNITY', 'AI'],
    imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&auto=format&fit=crop&q=80',
    partnerIds: ['person-1', 'person-2'],
    actionUrl: '#events',
  },
  {
    id: 'series-2',
    title: 'Weekend AI Cafe (週末カフェもくもく会)',
    summary: '週末の朝、お気に入りのカフェに集まってAIを触るカジュアルな集まり。初心者からヘビーユーザーまで自由に交流。',
    status: 'ACTIVE',
    tags: ['COMMUNITY', 'CREATIVE'],
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
    partnerIds: ['person-3', 'person-4'],
    actionUrl: '#events',
  },
];

export const mockRecentActivities: Activity[] = [
  {
    id: 'act-1',
    title: 'AI Social Night #05 — 夏のAIクリエイティブ祭り',
    summary: '28名が集まり、画像生成AIや音声AIを使った即興作品の発表会と懇親会を開催。',
    category: 'EVENT',
    tags: ['COMMUNITY', 'CREATIVE'],
    status: 'COMPLETED',
    date: '2026-08-15',
    displayDate: '2026.08.15',
    imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&auto=format&fit=crop&q=80',
    participantCount: 28,
    partnerIds: ['person-1', 'person-3'],
  },
  {
    id: 'act-2',
    title: 'AI × Food ディナーミートアップ in 恵比寿',
    summary: '美味しい料理を食べながら、それぞれの仕事でのAI活用やこれからのアイデアを語り合うディナー会。',
    category: 'EVENT',
    tags: ['COMMUNITY'],
    status: 'COMPLETED',
    date: '2026-07-28',
    displayDate: '2026.07.28',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
    participantCount: 12,
    partnerIds: ['person-2', 'person-4'],
  },
  {
    id: 'act-3',
    title: '週末AI体験カフェ #12 @ 表参道',
    summary: '休日の午前にカフェで集まり、ChatGPTの新機能や便利プロンプトをみんなで試す会を実施。',
    category: 'EVENT',
    tags: ['COMMUNITY', 'AI'],
    status: 'COMPLETED',
    date: '2026-06-10',
    displayDate: '2026.06.10',
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
    participantCount: 16,
    partnerIds: ['person-1', 'person-2'],
  },
];

export const mockTestimonials: Testimonial[] = [
  {
    id: 't-1',
    quote: '「堅苦しいセミナーや営業名刺交換会と違って、草野球のように気軽に集まってみんなでAIを楽しめる雰囲気が最高でした。」',
    author: 'A. K.',
    role: 'Event Participant',
    activityName: 'AI Social Night #05',
  },
  {
    id: 't-2',
    quote: '「AIに詳しくない私でも温かく迎えてくれて、その場で面白い画像を作ったり新しい友達ができました。」',
    author: 'M. S.',
    role: 'Creative Workshop Attendee',
    activityName: 'AI × Coffee Cafe #12',
  },
  {
    id: 't-3',
    quote: '「人と人が自然につながる場。ここで出会った人と次のイベントを一緒に企画することになりました！」',
    author: 'T. H.',
    role: 'Community Member',
    activityName: 'AI Dinner & Talk',
  },
];
