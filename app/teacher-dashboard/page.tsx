import type { Metadata } from 'next';
import TeacherDashboardPageClient from './TeacherDashboardPageClient';

export const metadata: Metadata = {
  title: 'Teacher Dashboard | Lantern & Lion',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <TeacherDashboardPageClient />;
}
