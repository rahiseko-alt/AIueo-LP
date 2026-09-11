/**
 * 企画に添付する画像の、受け取りと検証。
 *
 * 画像はフォームから data URL（`data:image/jpeg;base64,...`）の文字列として届く。
 * ファイルそのものではなく文字列にしているのは、送信前にブラウザ側で縮小した
 * 結果をそのまま渡すためで、これにより元が何MBでもサーバーへ届くのは縮小後の
 * 分だけになる。ただしブラウザ側の縮小は迂回できるので、**上限と種類の判定は
 * 必ずここ（サーバー側）でも行う**。
 */

/** 保存を許す画像の種類。DBのCHECK制約（`drizzle/0003`）と必ず一致させる。 */
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** 保存を許す大きさの上限。縮小後の想定は数百KBで、これはその余裕分を見た値。 */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export type ImageUpload =
  | { kind: 'unchanged' }
  | { kind: 'remove' }
  | { kind: 'replace'; mime: string; data: Buffer }
  | { kind: 'invalid'; error: string };

/**
 * フォームの値から、画像に対して何をするかを決める。
 *
 * - `imageRemove` が on なら削除
 * - `imageData` に data URL があれば差し替え
 * - どちらも無ければ現状維持（編集画面で画像を選び直さなかった場合）
 */
export function parseImageUpload(formData: FormData): ImageUpload {
  if (formData.get('imageRemove') === 'on') return { kind: 'remove' };

  const value = formData.get('imageData');
  if (typeof value !== 'string' || value.length === 0) return { kind: 'unchanged' };

  const match = /^data:(image\/[a-z+]+);base64,([A-Za-z0-9+/=]+)$/.exec(value);
  if (!match) return { kind: 'invalid', error: '画像を読み取れませんでした。JPEG・PNG・WebPの画像を選び直してください。' };

  const mime = match[1];
  if (!(ALLOWED_MIME as readonly string[]).includes(mime)) {
    return { kind: 'invalid', error: '画像はJPEG・PNG・WebPのいずれかを選んでください。' };
  }

  const data = Buffer.from(match[2], 'base64');
  if (data.length === 0) return { kind: 'invalid', error: '画像が空でした。選び直してください。' };
  if (data.length > MAX_IMAGE_BYTES) {
    return { kind: 'invalid', error: '画像が大きすぎます。2MBより小さい画像を選んでください。' };
  }
  return { kind: 'replace', mime, data };
}

/**
 * 版履歴・監査ログへ企画の行を残す前に、画像の中身だけを落とす。
 *
 * `select *` / `returning *` で取った行をそのまま `JSON.stringify` すると、
 * `image_data` の bytea が `{"type":"Buffer","data":[137,80,...]}` という
 * **元の画像より大きなJSON**になって jsonb 列へ入る。保存・編集・状態変更の
 * たびに2か所（proposal_versions と audit_log）へ積み上がるので、必ず落とす。
 * 画像が付いていたかどうかは `has_image` で残す。
 */
export function withoutImageData(row: Record<string, unknown>) {
  const { image_data: imageData, ...rest } = row;
  return { ...rest, has_image: imageData != null };
}
