import type { Metadata } from 'next';
import ChildDashboardPageClient from './ChildDashboardPageClient';

export const metadata: Metadata = {
  title: 'Child Dashboard | Lantern & Lion',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ChildDashboardPageClient />;
}
