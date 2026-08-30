import type { Metadata } from 'next';
import CharacterPageClient from './CharacterPageClient';

export const metadata: Metadata = {
  title: 'Character Creator | Lantern & Lion',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CharacterPageClient />;
}
