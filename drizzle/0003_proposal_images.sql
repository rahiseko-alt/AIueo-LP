-- 企画に画像を1枚添付できるようにする。
--
-- 保存先をDBにしたのは、外部のファイル保管サービス（Vercel Blob 等）を使うと
-- 利用者がコンソールで保管領域を作り、鍵を発行し、環境変数へ入れる作業が要るため。
-- この規模（1企画1枚・縮小後 数百KB）なら、DBに置いても実用上の問題は出ない。
-- 送信前にブラウザ側で長辺1280pxへ縮小するので、元が数MBでも入るのは縮小後の分だけ。
--
-- image_data と image_mime は必ず揃って入る／揃って消える（片方だけ残すと
-- 配信側が「画像あり」と判断して空を返す）。
alter table proposals
  add column if not exists image_data bytea,
  add column if not exists image_mime text,
  add column if not exists image_updated_at timestamptz;

alter table proposals drop constraint if exists proposals_image_mime_check;
alter table proposals add constraint proposals_image_mime_check
  check (image_mime is null or image_mime in ('image/jpeg', 'image/png', 'image/webp'));

alter table proposals drop constraint if exists proposals_image_pair_check;
alter table proposals add constraint proposals_image_pair_check
  check ((image_data is null) = (image_mime is null));
