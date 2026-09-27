import 'server-only';
import { createHash } from 'node:crypto';
import { PUBLISH_STATEMENT_LINES, PUBLISH_STATEMENT_VERSION } from '@/lib/proposals/publish-rules';

/**
 * 公開ボタンを押したことを、確認文への同意として残す記録を作る。
 *
 * 版とハッシュはフォームから受け取らず、ここ（サーバー側の定数）から入れる。
 * 画面の確認文と同じ `PUBLISH_STATEMENT_LINES` を使うので、表示した文と記録が食い違わない。
 * **公開するときだけ作る。** 下書き保存は確認とみなさない（記録は `{}` のまま）。
 */
export function buildPublishDeclaration(actorId: string, extra: { organizerName: string; moneyType: string }) {
  return {
    method: 'button',
    statement_version: PUBLISH_STATEMENT_VERSION,
    statement_hash: createHash('sha256').update(PUBLISH_STATEMENT_LINES.join('\n')).digest('hex'),
    confirmed_at: new Date().toISOString(),
    actor_id: actorId,
    // 確認文の中で本人に見せた値。押した時点で何が表示されていたかを残す。
    shown_organizer_name: extra.organizerName,
    shown_money_type: extra.moneyType,
    prohibited_confirmed: true,
    rights_confirmed: true,
    money_confirmed: true,
  };
}
