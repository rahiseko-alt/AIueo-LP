import { Activity, Person, Project, Testimonial } from '@/types';

export const mockLeagueInfo = {
  name: 'AI League AIueo',
  tagline: 'Initiative × Co-Creation × Alliance',
  subheading: '「今度何かやりましょう」を、「こういうのやるので、一緒にどうですか？」に変える草AI同盟。',
  location: 'Tokyo & Local & Online · Est. 2026',
};

export const mockPeople: Person[] = [
  {
    id: 'person-1',
    name: 'Kouhei Kosehira',
    role: 'Alliance Founder / Organizer',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    activityIds: ['act-hero', 'act-next-1', 'act-1'],
  },
  {
    id: 'person-2',
    name: 'Yuka Takahashi',
    role: 'Life & Family AI Lecturer',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    activityIds: ['act-next-1', 'act-1'],
  },
  {
    id: 'person-3',
    name: 'Taro Yamada',
    role: 'Client Work & Tech Lead',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    activityIds: ['act-hero', 'act-next-3', 'act-2'],
  },
  {
    id: 'person-4',
    name: 'Kenichi Suzuki',
    role: 'Kids AI Mentor / Local Organizer',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    activityIds: ['act-next-2', 'act-3'],
  },
];

export const mockHeroActivity: Activity = {
  id: 'act-hero',
  title: '「こういうのやるんですけど、一緒にどうですか？」',
  summary: '主婦向けAIセミナー、地域の子ども向けAI教室、受注開発チームの結成、深夜の熱狂LT会まで。ジャンルは問わない。AIに関わる人が自分のやりたい企画を実際に立ち上げ、仲間を巻き込む草AI同盟。',
  category: 'EVENT',
  tags: ['COMMUNITY', 'AI', 'DEVELOPMENT', 'EDUCATION'],
  status: 'UPCOMING',
  date: '2026-09-20',
  displayDate: 'FEATURED INITIATIVE',
  imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80',
  location: 'Tokyo / Regional / Online',
  spots: '誰でも企画・参加歓迎',
  actionUrl: '#events',
  actionLabel: '進行中の企画を見る →',
  isHero: true,
};

export const mockSliderPhotos = [
  {
    url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1000&auto=format&fit=crop&q=80',
    caption: '地域の子ども向けAIお絵描き教室',
  },
  {
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1000&auto=format&fit=crop&q=80',
    caption: '主婦・初心者向け暮らしのAI時短セミナー',
  },
  {
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&auto=format&fit=crop&q=80',
    caption: '受託開発＆プロトタイプ実装チームのキックオフ',
  },
  {
    url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1000&auto=format&fit=crop&q=80',
    caption: 'エンジニア＆クリエイター即興AI LT大会',
  },
];

export const mockUpcomingActivities: Activity[] = [
  {
    id: 'act-next-1',
    title: '主婦・シニア向け「暮らしと家事がラクになるChatGPT活用セミナー」',
    summary: '献立作成、旅行計画、学校のお便り整理など、生活に直結するAIの使い方をハンズオンで教える企画。共催・アシスタント募集中。',
    category: 'EVENT',
    tags: ['EDUCATION', 'AI'],
    status: 'UPCOMING',
    date: '2026-10-04',
    displayDate: '10.04 SAT 10:30',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
    location: 'Setagaya Community Hall / Online',
    spots: '参加 15名 / 運営サポーター募集中',
    actionUrl: '#join',
    actionLabel: '参加・サポートする',
  },
  {
    id: 'act-next-2',
    title: '地域の子ども向け「AIで動くオリジナル絵本を作ろう！ワークショップ」',
    summary: '画像生成AIと音声AIを使って、小学生が自分の物語を1本のデジタル絵本にする体験イベント。地元公民館と連携開催。',
    category: 'EVENT',
    tags: ['COMMUNITY', 'CREATIVE', 'AI'],
    status: 'UPCOMING',
    date: '2026-10-18',
    displayDate: '10.18 SUN 13:00',
    imageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80',
    location: 'Kamakura Local Hub',
    spots: '親子10組限定 (メンター募集中)',
    actionUrl: '#join',
    actionLabel: '詳細・メンター参加',
  },
  {
    id: 'act-next-3',
    title: '自治体・地元店舗向けAI導入受託プロジェクト（チームメンバー募集）',
    summary: '地域商店街の多言語AI案内ボットと販促画像自動化を受注開発。デザイン・フロントエンド・プロンプト実装者を募集。',
    category: 'PROJECT',
    tags: ['DEVELOPMENT', 'LOCAL', 'AI'],
    status: 'UPCOMING',
    date: '2026-10-25',
    displayDate: '10.25 KICKOFF',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
    location: 'Shibuya Office / Discord',
    spots: '開発メンバー 3名募集',
    actionUrl: '#join',
    actionLabel: '開発チームに応募',
  },
  {
    id: 'act-next-4',
    title: '第6回 AIオタク集結！なんでもありの5分即興LTナイト',
    summary: 'ローカルLLM、最新画像生成、自動化ボットなど、自分が最近試して面白かったAIの実験結果を持ち寄り発表するLT会。',
    category: 'EVENT',
    tags: ['COMMUNITY', 'DEVELOPMENT', 'AI'],
    status: 'UPCOMING',
    date: '2026-11-07',
    displayDate: '11.07 SAT 18:00',
    imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=80',
    location: 'Shibuya Space & YouTube Live',
    spots: '登壇者8名 / 観覧自由',
    actionUrl: '#join',
    actionLabel: '登壇・観覧エントリー',
  },
];

export const mockInitiativeFormats: Project[] = [
  {
    id: 'format-1',
    title: '暮らし・教育系 AIセミナー＆教室',
    summary: '「主婦向け」「シニア向け」「子ども向け」など、地域や一般層にAIの楽しさと便利さを届ける普及活動・ワークショップ。',
    status: 'ACTIVE',
    tags: ['EDUCATION', 'COMMUNITY'],
    imageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80',
    partnerIds: ['person-2', 'person-4'],
    actionUrl: '#events',
  },
  {
    id: 'format-2',
    title: '受託開発・実務プロジェクト共創',
    summary: '企業や自治体からのAI導入・プロトタイプ開発案件を、同盟メンバーでチームを組んで受注・納品する実践型アライアンス。',
    status: 'ACTIVE',
    tags: ['DEVELOPMENT', 'AI'],
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
    partnerIds: ['person-1', 'person-3'],
    actionUrl: '#events',
  },
  {
    id: 'format-3',
    title: '技術LT大会＆実験ミートアップ',
    summary: '開発者やクリエイターが自作AIツールや実験成果を発表し合い、次の新しい共同プロジェクトを生み出す熱狂の場。',
    status: 'ACTIVE',
    tags: ['COMMUNITY', 'CREATIVE'],
    imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=80',
    partnerIds: ['person-1', 'person-3', 'person-4'],
    actionUrl: '#events',
  },
];

export const mockRecentActivities: Activity[] = [
  {
    id: 'act-1',
    title: '主婦向け「今日から使えるChatGPT家事時短セミナー」',
    summary: '世田谷の地域コミュニティで24名の主婦が参加。献立提案やプリント整理の実演を行い大好評。',
    category: 'EVENT',
    tags: ['EDUCATION', 'AI'],
    status: 'COMPLETED',
    date: '2026-08-15',
    displayDate: '2026.08.15',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
    participantCount: 24,
    partnerIds: ['person-2', 'person-1'],
  },
  {
    id: 'act-2',
    title: '地元商店街の多言語AIマッププロトタイプ共同納品',
    summary: '同盟内のエンジニアとデザイナー3名でチームを組み、外国人観光客向けAI案内システムを受託開発・納品。',
    category: 'PROJECT',
    tags: ['DEVELOPMENT', 'AI'],
    status: 'COMPLETED',
    date: '2026-07-28',
    displayDate: '2026.07.28',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
    participantCount: 3,
    partnerIds: ['person-1', 'person-3'],
  },
  {
    id: 'act-3',
    title: '夏休み小学生向け「AIお絵描きプログラミング教室」',
    summary: '鎌倉の学童クラブで18名の子どもたちと生成AIを活用したオリジナルカードゲーム制作を実施。',
    category: 'EVENT',
    tags: ['COMMUNITY', 'CREATIVE'],
    status: 'COMPLETED',
    date: '2026-06-10',
    displayDate: '2026.06.10',
    imageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80',
    participantCount: 18,
    partnerIds: ['person-4', 'person-1'],
  },
];

export const mockTestimonials: Testimonial[] = [
  {
    id: 't-1',
    quote: '「『いつか主婦向けのAIセミナーをやりたい』とずっと温めていたアイデアを、AIueoで『来月やりましょう！』と背中を押してもらえて実現できました。」',
    author: 'Y. T.',
    role: 'Seminar Host / Life AI Lecturer',
    activityName: '主婦向けChatGPT活用セミナー',
  },
  {
    id: 't-2',
    quote: '「『今度何かやりましょう』の飲み会で終わらない。具体的な受託案件や地域企画のチームがその場で組めるのが本当に価値高い。」',
    author: 'T. Y.',
    role: 'Freelance AI Engineer',
    activityName: '商店街AI受託プロジェクト',
  },
  {
    id: 't-3',
    quote: '「子ども向けAI教室のメンターとして参加しました。自分のスキルが地域の喜びに変わる体験ができました。」',
    author: 'K. S.',
    role: 'Kids AI Mentor',
    activityName: '小学生向けAIお絵描き教室',
  },
];

/**
 * Person.activityIds から活動を引くための全件インデックス。
 * ここに載っていない活動を参照すると人物カードの実績行が消えるため、
 * 活動を追加したらこの配列にも必ず含めること。
 */
export const mockAllActivities: Activity[] = [
  mockHeroActivity,
  ...mockUpcomingActivities,
  ...mockRecentActivities,
];
