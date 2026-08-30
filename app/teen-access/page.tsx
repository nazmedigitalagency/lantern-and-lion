import type { Metadata } from 'next';
import TeenAccessPageClient from './TeenAccessPageClient';

export const metadata: Metadata = {
  title: 'Teen Sign In | Lantern & Lion',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <TeenAccessPageClient />;
}
