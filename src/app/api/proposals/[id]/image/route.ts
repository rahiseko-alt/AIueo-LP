import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/neon/db';
import { getAuthContext } from '@/lib/auth/dal';

export const dynamic = 'force-dynamic';

/**
 * 企画に添付された画像を返す。
 *
 * 誰に見せるかは、企画ページ本体と同じ条件で決める。
 *  - 公開中・公開範囲public・期限内 … 誰でも
 *  - それ以外（下書き・非公開・期限切れ）… その企画の持ち主と管理者だけ
 *
 * 条件を緩めると、下書きの企画に付けた画像がURLを推測されて漏れる。
 * 見せられないときは 403 ではなく 404 を返す。存在の有無自体を伏せるため。
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!db) return new NextResponse(null, { status: 404 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return new NextResponse(null, { status: 404 });

  const result = await db.$client.query(
    `select image_data, image_mime, image_updated_at, owner_id, status, visibility, public_expires_at
     from proposals where id = $1 limit 1`,
    [id],
  );
  const row = result.rows[0] as
    | {
        image_data: Buffer | null;
        image_mime: string | null;
        image_updated_at: Date | null;
        owner_id: string;
        status: string;
        visibility: string;
        public_expires_at: Date;
      }
    | undefined;
  if (!row || !row.image_data || !row.image_mime) return new NextResponse(null, { status: 404 });

  const publiclyVisible =
    row.status === 'published' && row.visibility === 'public' && row.public_expires_at.valueOf() > Date.now();

  if (!publiclyVisible) {
    const context = await getAuthContext();
    const isOwner = context.kind === 'member' && context.userId === row.owner_id;
    const isAdmin = context.kind === 'member' && context.profile.role === 'admin' && context.profile.status === 'active';
    if (!isOwner && !isAdmin) return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(row.image_data), {
    status: 200,
    headers: {
      'Content-Type': row.image_mime,
      'Content-Length': String(row.image_data.length),
      // 公開中の画像だけを共有キャッシュに載せる。持ち主しか見られない画像を
      // public にすると、経路上のキャッシュから他人に渡りうる。
      'Cache-Control': publiclyVisible ? 'public, max-age=60, stale-while-revalidate=300' : 'private, no-store',
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
