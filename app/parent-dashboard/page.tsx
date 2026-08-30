import type { Metadata } from 'next';
import ParentDashboardPageClient from './ParentDashboardPageClient';

export const metadata: Metadata = {
  title: 'Parent Dashboard | Lantern & Lion',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ParentDashboardPageClient />;
}
