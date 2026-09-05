/**
 * サイト全体で共有する識別情報。
 *
 * `metadataBase` / canonical / OGP / robots / sitemap がすべて同じ住所を
 * 名乗る必要があるため、1箇所に置く。`aiueo-lp.vercel.app` でも同じ内容が
 * 開けるので、ここを指定しないと検索の評価が2つの住所に分散する。
 */
export const siteUrl = 'https://aiueo.kouheikosehira.com';

export const siteName = 'AI League AIueo';

export const siteDescription =
  'AIを触る仲間を集める場。「今度何かやりましょう」を「こういうのやるので、一緒にどうですか？」に変えます。参加は登録不要。';

/** 検索エンジンにも sitemap にも載せない、会員・管理・APIの経路。 */
export const privatePathPrefixes = ['/admin', '/member', '/api', '/auth'];
