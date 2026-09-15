import { NextResponse } from 'next/server';
import { db } from '@/lib/neon/db';

export const dynamic = 'force-dynamic';

/**
 * 本番DBに、マイグレーションで足した列が実際に存在するかを、外から確かめるための窓口。
 *
 * これを置いた理由: 2026-09-15、`drizzle/0005` を本番へ適用しないまま、その列を読むコードを
 * マージし、本番の公開ページ4つを2分30秒のあいだ500にした。マージ前に適用状況を外から
 * 観測する手段が無かったことが原因である。
 *
 * この窓口は**新しい列そのものを読まない**（`information_schema` を見るだけ）ので、
 * 未適用の状態でも安全に動く。だから列を使うコードより先にこれだけ出しておけば、
 * 以後は毎回マージ前に確かめられる。
 *
 * 返すのは、下の表に書いた組み合わせが「有るか無いか」だけである。利用者のデータは返さない。
 * 外から表や列の名前を指定することはできない（問い合わせ先はこの表に固定）。
 *
 * 新しいマイグレーションを足したら、**その列をここへ `pending` で追加してから**
 * 本番へ適用し、`ok` と `pendingMissing` を見て、そのあとで利用する側のコードを出す。
 * 適用が済んだら `required` へ移す。
 */
type Expectation = {
  migration: string;
  table: string;
  column: string;
  /**
   * required … いま本番で動いているコードが読む列。欠けていれば本番が壊れている。
   * pending  … これから出すコードが読む列。欠けていても今は正常。適用の確認に使う。
   */
  status: 'required' | 'pending';
};

const EXPECTED_COLUMNS: ReadonlyArray<Expectation> = [
  { migration: '0001_rate_limits', table: 'rate_limits', column: 'bucket_key', status: 'required' },
  { migration: '0003_proposal_images', table: 'proposals', column: 'image_data', status: 'required' },
  { migration: '0003_proposal_images', table: 'proposals', column: 'image_mime', status: 'required' },
  { migration: '0003_proposal_images', table: 'proposals', column: 'image_updated_at', status: 'required' },
  { migration: '0004_proposal_application_url', table: 'proposals', column: 'application_url', status: 'required' },
  // P37（参加人数）。本番へ適用され、ここが present になってから、利用する側のコードを出す。
  { migration: '0005_proposal_headcount', table: 'proposals', column: 'capacity', status: 'pending' },
  { migration: '0005_proposal_headcount', table: 'proposals', column: 'participant_count', status: 'pending' },
];

export async function GET() {
  if (!db) return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });

  const client = await db.$client.connect();
  try {
    const found = await client.query<{ table_name: string; column_name: string }>(
      `select table_name, column_name
         from information_schema.columns
        where table_schema = 'public'
          and table_name = any($1::text[])
          and column_name = any($2::text[])`,
      [
        [...new Set(EXPECTED_COLUMNS.map((item) => item.table))],
        [...new Set(EXPECTED_COLUMNS.map((item) => item.column))],
      ],
    );
    const present = new Set(found.rows.map((row) => `${row.table_name}.${row.column_name}`));

    const checks = EXPECTED_COLUMNS.map((item) => ({
      migration: item.migration,
      column: `${item.table}.${item.column}`,
      status: item.status,
      present: present.has(`${item.table}.${item.column}`),
    }));

    return NextResponse.json(
      {
        // いま動いているコードが必要とする列がすべて揃っているか。
        ok: checks.every((check) => check.status !== 'required' || check.present),
        requiredMissing: checks.filter((c) => c.status === 'required' && !c.present).map((c) => c.column),
        // これから出すコードが必要とする列のうち、まだ適用されていないもの。
        pendingMissing: checks.filter((c) => c.status === 'pending' && !c.present).map((c) => c.column),
        checks,
      },
      { status: 200, headers: { 'cache-control': 'no-store' } },
    );
  } catch {
    // 原因を外へ漏らさない。詳しくはVercelのログに出す。
    console.error('schema health check failed');
    return NextResponse.json({ error: 'check_failed' }, { status: 500 });
  } finally {
    client.release();
  }
}
