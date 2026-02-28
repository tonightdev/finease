import type { Metadata } from 'next';
import PortfolioPageClient from './PortfolioPageClient';

export const metadata: Metadata = {
  title: 'Portfolio | FinEase',
  description: 'Track your Net Worth and Investment Portfolio',
};

export default function Page() {
  return <PortfolioPageClient />;
}
