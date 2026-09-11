/**
 * 企画に添付された画像。無ければ何も描かない。
 *
 * `next/image` ではなく素の `img` を使っているのは、この画像がDBから
 * Route Handler 経由で出るもので、ビルド時にも配信時にも寸法が分からないため。
 */
export function ProposalImage({
  proposalId,
  title,
  hasImage,
  className = 'mt-6 w-full max-w-full border border-white/10 object-cover',
}: {
  proposalId: string;
  title: string;
  hasImage: boolean;
  className?: string;
}) {
  if (!hasImage) return null;
  return (
    // 企画者がDBへ入れた画像で、寸法も枚数も事前に分からない。next/image の
    // 最適化を通すと、認証つきの動的経路を最適化器が取りに行くことになる。
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/proposals/${proposalId}/image`}
      alt={`${title} の画像`}
      className={className}
      loading="lazy"
    />
  );
}
