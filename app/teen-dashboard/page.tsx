import type { Metadata } from 'next';
import TeenDashboardPageClient from './TeenDashboardPageClient';

export const metadata: Metadata = {
  title: 'Teen Dashboard | Lantern & Lion',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <TeenDashboardPageClient />;
}
