import type { Metadata } from 'next';
import TeacherAccessPageClient from './TeacherAccessPageClient';

export const metadata: Metadata = {
  title: 'Teacher Sign In | Lantern & Lion',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <TeacherAccessPageClient />;
}
