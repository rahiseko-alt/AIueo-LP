/**
 * 管理者が手で選べる掲載状態。
 *
 * `submitted` は含めない。`drizzle/0000_neon_foundation.sql` の CHECK 制約に
 * 存在しないため、選ぶと必ず制約違反になる。仕様書には状態名として載って
 * いるが、実際にその状態を作るコードは無い。
 *
 * `auto_hidden` と `expired` も含めない。どちらも期限処理（cron）が付ける
 * 状態で、手で付けると「なぜ非公開になったか」の記録が実態とずれる。
 * 管理者が公開から外すときは `hidden` を使う。
 *
 * `'use server'` のファイルは async 関数しか export できないため、
 * この定数は actions.ts の外に置く。
 */
export const adminSelectableStatuses = ['draft', 'published', 'needs_revision', 'hidden', 'ended', 'cancelled'] as const;
