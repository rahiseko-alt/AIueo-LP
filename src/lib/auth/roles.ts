/**
 * この場に居る人の「立場」を、1か所で決める。
 *
 * DBには `profiles.role`（`member` / `admin`）と `profiles.status`
 * （`pending_profile` / `active` / `suspended` / `withdrawn`）が別々に入っていて、
 * 画面ごとに「会員」「メンバー」「企画者」「主催者」と呼び方が割れていた。
 * 呼び方が割れていると、**誰が何をできるのかが利用者にも書く側にも分からなくなる。**
 *
 * 立場は3つしかない。増やさない。
 *
 *  1. 管理者   … 運営者本人だけ。掲載を止める・会員を停止するなど、全体に効く操作を持つ。
 *  2. 登録者   … 会員登録を済ませた人。**企画を立てて公開できる。** それ以外は一般と同じ。
 *  3. 一般     … 登録していない人。公開中の企画を見て、主催者へ直接連絡して参加できる。
 *
 * 「参加するのに登録は要らない」は、この場の決めごとの中心である
 * （`MEMBERSHIP_FEATURE_SPEC.md` 基本方針）。画面の言葉もそれに揃える。
 */

export type Standing = 'admin' | 'registered' | 'general';

export const STANDING_LABELS: Record<Standing, string> = {
  admin: '管理者',
  registered: '登録者',
  general: '一般',
};

/** 立場ごとの、できることの説明。画面に出す文言の正本。 */
export const STANDING_DESCRIPTIONS: Record<Standing, string> = {
  admin: '運営者だけの立場です。危険な掲載をただちに止め、会員を停止できます。登録の手続きはありません。',
  registered: '会員登録を済ませた人の立場です。企画を立てて公開・編集・取り下げができます。それ以外は一般と変わりません。',
  general: '登録していない人の立場です。公開中の企画を見て、主催者へ直接連絡して参加できます。登録の手続きは要りません。',
};

/** 画面へ出す3行の表。`/register` と `/member` で同じものを見せる。 */
export const STANDING_GUIDE: Array<{ standing: Standing; canDo: string; needs: string }> = [
  { standing: 'general', canDo: '公開中の企画を見る・参加する', needs: '手続きなし' },
  { standing: 'registered', canDo: '一般にできること＋企画を立てて公開する', needs: '会員登録（Googleでログイン＋規約同意）' },
  { standing: 'admin', canDo: '掲載の停止・会員の停止など、場の安全を守る操作', needs: '運営者のみ。申し込みはできません' },
];
