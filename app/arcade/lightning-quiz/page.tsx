import type { Metadata } from 'next';
import LightningQuizPageClient from './LightningQuizPageClient';

export const metadata: Metadata = {
  title: 'Lightning Quiz | Lantern & Lion',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <LightningQuizPageClient />;
}
