import type { Metadata } from 'next';
import GoalsPageClient from './GoalsPageClient';

export const metadata: Metadata = {
  title: 'North Star Goals | FinEase',
  description: 'Track your financial milestones and savings gaps.',
};

export default function Page() {
  return <GoalsPageClient />;
}
