import type { Metadata } from 'next';
import { PolicyPage } from '@/components/policy-page';

export const metadata: Metadata = {
  title: '免責事項',
  description: 'AIueoは企画・参加・金銭の当事者ではありません。その範囲と、問題を把握した際に取る対応。',
  alternates: { canonical: '/disclaimer' },
  openGraph: { title: '免責事項', description: 'AIueoは企画・参加・金銭の当事者ではありません。その範囲と、問題を把握した際に取る対応。', url: '/disclaimer' },
};

export default function DisclaimerPage() {
  return <PolicyPage document="disclaimer" />;
}
