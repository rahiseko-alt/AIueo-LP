import type { Metadata } from 'next';
import { PolicyPage } from '@/components/policy-page';

export const metadata: Metadata = {
  title: '会員規約',
  description: 'AIueoの会員規約。企画の掲載と会員の権利・禁止事項を定めます。',
  alternates: { canonical: '/terms' },
  openGraph: { title: '会員規約', description: 'AIueoの会員規約。企画の掲載と会員の権利・禁止事項を定めます。', url: '/terms' },
};

export default function TermsPage() {
  return <PolicyPage document="terms" />;
}
