import type { Metadata } from 'next';
import ScriptureScramblePageClient from './ScriptureScramblePageClient';

export const metadata: Metadata = {
  title: 'Scripture Scramble | Lantern & Lion',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ScriptureScramblePageClient />;
}
