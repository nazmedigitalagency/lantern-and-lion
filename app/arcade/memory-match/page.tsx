import type { Metadata } from 'next';
import MemoryMatchPageClient from './MemoryMatchPageClient';

export const metadata: Metadata = {
  title: 'Memory Match | Lantern & Lion',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <MemoryMatchPageClient />;
}
