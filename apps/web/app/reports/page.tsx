import type { Metadata } from 'next';
import ReportsPageClient from './ReportsPageClient';

export const metadata: Metadata = {
  title: 'Reports | FinEase',
  description: 'View comprehensive financial reports and analytics.',
};

export default function Page() {
  return <ReportsPageClient />;
}
