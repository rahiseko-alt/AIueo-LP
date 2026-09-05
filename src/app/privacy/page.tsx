import type { Metadata } from 'next';
import { PolicyPage } from '@/components/policy-page';

export const metadata: Metadata = {
  title: 'プライバシーポリシー',
  description: 'AIueoが取得する情報と、その利用目的・保存の方針。',
  alternates: { canonical: '/privacy' },
  openGraph: { title: 'プライバシーポリシー', description: 'AIueoが取得する情報と、その利用目的・保存の方針。', url: '/privacy' },
};

export default function PrivacyPage() {
  return <PolicyPage document="privacy" />;
}
