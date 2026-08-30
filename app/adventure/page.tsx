import type { Metadata } from 'next';
import AdventurePageClient from './AdventurePageClient';

export const metadata: Metadata = {
  title: 'Adventure Map | Lantern & Lion',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdventurePageClient />;
}
