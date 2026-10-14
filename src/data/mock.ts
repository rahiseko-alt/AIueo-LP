import { Activity, Person } from '@/types';

export const mockPeople: Person[] = [
  {
    id: 'person-1',
    name: '小齊平 恒平',
    role: '代表 / AI活動家',
    avatarUrl: '/images/japanese/kosehirakouhei-profile.png',
    // 本人から受け取ったリンク（2026-10-14）
    links: [
      { kind: 'x', url: 'https://x.com/kosehirax' },
      { kind: 'website', url: 'https://kouheikosehira.com/' },
    ],
    // 見本の活動名を本人の実績として並べないため空にする。
    activityIds: [],
    // 本人（代表）の指示による文面
    bio: 'play with AIをコンセプトに人の繋がりを広げる場としてAIueoを設立。他にもAI専門学校講師やAIコンサルティングなど教育現場や企業でのAI活用を行っている。',
  },
  {
    id: 'person-2',
    name: '伊藤良二',
    role: 'プロデューサー',
    avatarUrl: '/images/japanese/avatar-2-v2.png',
    // 本人から受け取ったリンク（2026-10-14）
    links: [
      { kind: 'facebook', url: 'https://www.facebook.com/ryouji.itou.3?locale=ja_JP' },
      { kind: 'instagram', url: 'https://www.instagram.com/craftlineworks2026/' },
      { kind: 'x', url: 'https://x.com/ohga_writer' },
    ],
    activityIds: [],
    // 出典: https://x.com/ohga_writer のプロフィール文
    bio: 'Craft Line Works代表｜AI講師｜個人向けAI活用コンサル｜業務効率化の伴走サポーター｜SEO / MEO / AIO 対策｜店舗Web集客導線の改善（AIによる自動化）｜HP作成　Zoom無料相談受付中　まずはDMにて',
  },
  {
    id: 'person-4',
    name: '岡本ジュンイチ',
    role: '顧問 / SNSマーケター・メディアプロデューサー',
    avatarUrl: '/images/japanese/avatar-okamoto-v1.jpg',
    // 本人から受け取ったリンク（2026-10-14）。共有用の追跡パラメータ（xtok・mibextid・s・si・_r・_t）は外した。
    // lit.link はリンクまとめページなのでホームページのアイコンで出す
    links: [
      { kind: 'instagram', url: 'https://instagram.com/okajun39' },
      { kind: 'facebook', url: 'https://www.facebook.com/share/1KKbGU33b6/' },
      { kind: 'x', url: 'https://x.com/okamotojuniti' },
      { kind: 'tiktok', url: 'https://www.tiktok.com/@okamotojuniti1' },
      { kind: 'youtube', url: 'https://youtube.com/@okamotojuniti' },
      { kind: 'website', url: 'https://lit.link/okamotojuniti' },
    ],
    activityIds: [],
    bio: 'おもに個人事業主のマーケティング支援のために、SNS・出版・公認ネットラジオ局による冠番組等をプロデュースします。未経験からサポートする伴走型の起業支援や、実績ゼロからのメディアプロデュースを提供することができます。',
  },
  {
    id: 'person-3',
    name: '堺 彬',
    role: '株式会社SakAI Nexus 代表取締役',
    avatarUrl: '/images/japanese/avatar-sakai-v1.png',
    // 本人から受け取ったリンク（2026-10-14）。株式会社SakAI Nexus の公式サイト
    links: [{ kind: 'website', url: 'https://sakainexus.com/' }],
    activityIds: [],
    bio: 'Webライター・メディア運営の経験を経て、現在は生成AIを活用した業務改善、AI導入支援、システム開発、企業研修・講演を行う。',
  },
  {
    id: 'person-5',
    name: '八巻早紀',
    role: 'AIコミュニティ運営・編集者',
    avatarUrl: '/images/japanese/avatar-yamaki-v1.jpg',
    // 本人から受け取ったリンク（2026-10-14）。共有用の追跡パラメータ（mibextid・rdid・share_url）は外し、プロフィールIDだけにした
    links: [{ kind: 'facebook', url: 'https://www.facebook.com/profile.php?id=100029230621734' }],
    activityIds: [],
    bio: '個人がネットを活用して、自分の商品やサービスを届けるための発信、集客、導線づくり、AI活用をサポート。AIを使う、使わない両方の手段で商品づくりから販売につながる流れまで、初心者にもわかりやすく整理します。AI・WEB活用コミュニティも運営中。ご相談はDMにて。',
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
