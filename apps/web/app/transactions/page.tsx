import type { Metadata } from 'next';
import TransactionsPageClient from './TransactionsPageClient';

export const metadata: Metadata = {
  title: 'Transactions | FinEase',
  description: 'Manage and categorize your transactions.',
};

export default function Page() {
  return <TransactionsPageClient />;
}
