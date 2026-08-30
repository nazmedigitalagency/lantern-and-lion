import type { Metadata } from 'next';
import BibleDetectivePageClient from './BibleDetectivePageClient';

export const metadata: Metadata = {
  title: 'Bible Detective | Lantern & Lion',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <BibleDetectivePageClient />;
}
