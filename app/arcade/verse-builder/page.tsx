import type { Metadata } from 'next';
import VerseBuilderPageClient from './VerseBuilderPageClient';

export const metadata: Metadata = {
  title: 'Verse Builder | Lantern & Lion',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <VerseBuilderPageClient />;
}
