import { Activity, Person } from '@/types';

export const mockPeople: Person[] = [
  {
    id: 'person-1',
    name: '小齊平 恒平',
    role: '主宰 / 業務改善・自動化・AI活用支援',
    avatarUrl: '/images/japanese/kosehirakouhei-profile.png',
    // 見本の活動名を本人の実績として並べないため空にする。
    activityIds: [],
    bio: '中小企業や店舗のAI導入を支援しています。課題整理から業務フロー設計、試作、導入、教育までを一貫して担当。現場に立つ人が無理なく使い続けられるかを、判断の基準にしています。',
  },
  {
    id: 'person-2',
    name: '伊藤良二',
    role: 'AI顧問',
    avatarUrl: '/images/japanese/avatar-2-v2.png',
    activityIds: [],
    bio: '子どもにも仕事にもAI活用をやさしく伴走します。小中学生と保護者が安心してAIを学べるプログラムと、仕事にAIを取り入れたい方への初回無料相談を準備しています。',
  },
];

export const mockHeroActivity: Activity = {
  id: 'act-hero',
  title: '「こういうのやるんですけど、一緒にどうですか？」',
  summary: 'AIに関わる人が、自分のやりたい企画を実際に立ち上げ、仲間を巻き込む場です。ジャンルは問いません。参加するのに会員登録は要りません。',
  category: 'EVENT',
  tags: ['COMMUNITY', 'AI', 'DEVELOPMENT', 'EDUCATION'],
  status: 'UPCOMING',
  date: '2026-09-20',
  displayDate: 'FEATURED INITIATIVE',
  imageUrl: '/images/japanese/hero-ai-seminar-female.png',
  location: 'Tokyo / Regional / Online',
  spots: '誰でも企画・参加歓迎',
  actionUrl: '#events',
  actionLabel: '進行中の企画を見る →',
  isHero: true,
};

/**
 * 主宰・小齊平恒平が実際に納品した仕組み。出典は本人のサイト
 * https://kouheikosehira.com/ の「主な開発事例」である。
 * **AIueoの企画ではない**ので、画面側にもその旨を書いてある。
 * 参加人数・共同メンバーは持たない（捏造しやすい欄なので出さない）。
 * 写真は用意のある素材を当てているだけで、案件そのものの写真ではない。
 */
export const mockRecentActivities: Activity[] = [
  {
    id: 'act-1',
    title: 'SNS運用の自動化',
    summary:
      '投稿文の生成、自動投稿、反応の分析にもとづく修正までをひとつながりにした。媒体ごとのアルゴリズムとBAN対策も含む。',
    category: 'PROJECT',
    tags: ['AI', 'DEVELOPMENT'],
    status: 'COMPLETED',
    date: '2026-08-15',
    displayDate: '投稿の途絶がなくなった',
    imageUrl: '/images/japanese/meetup.png',
  },
  {
    id: 'act-2',
    title: 'AIチャットボット',
    summary:
      '自社資料だけを根拠に答える一次対応。回答には必ず出どころを示し、判断が必要なものは人へ回す。',
    category: 'PROJECT',
    tags: ['AI', 'LLM'],
    status: 'COMPLETED',
    date: '2026-07-28',
    displayDate: '定型の問い合わせを自動処理',
    imageUrl: '/images/japanese/development.png',
  },
  {
    id: 'act-3',
    title: '音声カルテ作成アプリ（ペット業界向け）',
    summary:
      '診察中に片手で音声入力し、記録を業務と同時進行にした。あとからの転記をなくすことを狙った。',
    category: 'PROJECT',
    tags: ['AI', 'PROTOTYPE'],
    status: 'COMPLETED',
    date: '2026-06-10',
    displayDate: '1日約2時間の事務作業を削減',
    imageUrl: '/images/japanese/workshop.png',
  },
  {
    id: 'act-4',
    title: '書類業務の半自動化アプリ（飲食業向け）',
    summary:
      '作業しながらの片手入力から書式変換、本部提出までを一気通貫に。現場で使い続けられることを最優先に設計した。',
    category: 'PROJECT',
    tags: ['AI', 'LOCAL'],
    status: 'COMPLETED',
    date: '2026-05-20',
    displayDate: '月50時間相当を削減',
    imageUrl: '/images/japanese/seminar.png',
  },
];

export const mockAllActivities: Activity[] = [mockHeroActivity, ...mockRecentActivities];
