import type { Metadata } from 'next';
import TransactionsImportClient from './TransactionsImportClient';

export const metadata: Metadata = {
  title: 'Import Transactions | FinEase',
  description: 'Upload bank statements to review and import transactions.',
};

export default function Page() {
  return <TransactionsImportClient />;
}
