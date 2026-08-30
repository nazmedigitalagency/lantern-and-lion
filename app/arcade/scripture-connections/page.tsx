import type { Metadata } from 'next';
import ScriptureConnectionsPageClient from './ScriptureConnectionsPageClient';

export const metadata: Metadata = {
  title: 'Scripture Connections | Lantern & Lion',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ScriptureConnectionsPageClient />;
}
