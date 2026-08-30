import type { Metadata } from 'next';
import BuildTheStoryPageClient from './BuildTheStoryPageClient';

export const metadata: Metadata = {
  title: 'Build the Story | Lantern & Lion',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <BuildTheStoryPageClient />;
}
