'use client';

import { useRef, useState } from 'react';

/** 縮小後の長辺。企画ページの表示幅（最大3xl≒768px）の2倍を上限にしている。 */
const MAX_EDGE = 1280;
/** JPEGの品質。0.82は、写真で目に見える劣化が出にくく、容量が数百KBに収まる値。 */
const JPEG_QUALITY = 0.82;

/**
 * 企画に添付する画像を選ぶ欄。
 *
 * **送信する前に、ブラウザの中で画像を縮小する。** スマートフォンの写真は
 * そのままだと1枚で数MBあり、送信の上限に当たって「押しても何も起きない」に
 * なる。縮小してから送れば、利用者は容量を気にせず普段の写真をそのまま選べる。
 *
 * 縮小した結果は data URL の文字列にして、隠し欄 `imageData` へ入れる。
 * サーバー側（`src/lib/proposals/image.ts`）でも種類と大きさを必ず検証する。
 * ここでの縮小は利便のためであって、防御ではない。
 */
export function ProposalImageField({ currentImageUrl, defaultData }: { currentImageUrl?: string; defaultData?: string }) {
  const [preview, setPreview] = useState<string | null>(defaultData ?? null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [remove, setRemove] = useState(false);
  const dataRef = useRef<HTMLInputElement>(null);

  const shown = preview ?? (remove ? null : currentImageUrl ?? null);

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setNote(null);
    try {
      const dataUrl = await shrink(file);
      if (dataRef.current) dataRef.current.value = dataUrl;
      setPreview(dataUrl);
      setRemove(false);
      const kb = Math.round((dataUrl.length * 3) / 4 / 1024);
      setNote(`この画像を添付します（約${kb}KBに縮小しました）。`);
    } catch {
      if (dataRef.current) dataRef.current.value = '';
      setPreview(null);
      setNote('この画像は読み取れませんでした。JPEG・PNG・WebPの画像を選び直してください。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <fieldset className="space-y-4 border-t border-white/10 pt-7">
      <legend className="font-mono text-xs tracking-[0.15em] text-[#c8a45a]">画像（任意・1枚）</legend>
      <p className="text-sm leading-7 text-white/65">
        企画ページの見出しの下に出ます。スマートフォンの写真をそのまま選んで構いません（送信前にこちらで小さくします）。
        写っている人・場所を掲載してよいことを確認してから選んでください。
      </p>

      <input ref={dataRef} type="hidden" name="imageData" defaultValue={defaultData} />

      {shown && (
        // 選んだ直後の確認用。data URL と Route Handler の両方を出すので素の img を使う。
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shown} alt="添付する画像の確認" className="max-h-64 w-full border border-white/15 object-contain" />
      )}

      <label className="block">
        <span className="form-label">画像を選ぶ</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onPick}
          disabled={busy}
          className="form-control file:mr-4 file:border-0 file:bg-[#c8a45a] file:px-4 file:py-2 file:text-[#080808]"
        />
      </label>

      {busy && <p role="status" className="text-sm text-white/70">画像を小さくしています…</p>}
      {note && <p role="status" className="text-sm leading-7 text-[#e4d2a6]">{note}</p>}

      {currentImageUrl && (
        <label className="flex gap-3 text-sm leading-7">
          <input
            name="imageRemove"
            type="checkbox"
            checked={remove}
            onChange={(event) => {
              setRemove(event.target.checked);
              if (event.target.checked && dataRef.current) dataRef.current.value = '';
              if (event.target.checked) setPreview(null);
            }}
            className="mt-2 h-4 w-4 accent-[#c8a45a]"
          />
          いま付いている画像を外す（保存すると画像なしになります）
        </label>
      )}
    </fieldset>
  );
}

/** 画像を長辺 MAX_EDGE まで縮めて、JPEGの data URL にする。 */
async function shrink(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  // JPEGは透明を扱えない。透明のまま描くと背景が黒く出るので、先に白で塗る。
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  if (!dataUrl.startsWith('data:image/jpeg;base64,')) throw new Error('encode failed');
  return dataUrl;
}
