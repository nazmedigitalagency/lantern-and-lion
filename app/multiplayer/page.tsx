import type { Metadata } from 'next';
import MultiplayerPageClient from './MultiplayerPageClient';

export const metadata: Metadata = {
  title: 'Bible Team Games for Families & Groups | Lantern & Lion',
  description:
    'Bible games for people you already know. Play live team challenges with family, friends or a class and grow in Scripture together.',
  alternates: { canonical: '/multiplayer' },
  openGraph: {
    title: 'Bible Team Games for Families & Groups | Lantern & Lion',
    description: 'Bible games for people you already know — live team challenges for family, friends and classes.',
    url: '/multiplayer',
  },
  twitter: {
    title: 'Bible Team Games for Families & Groups | Lantern & Lion',
    description: 'Bible games for people you already know — live team challenges for family, friends and classes.',
  },
};

export default function Page() {
  return <MultiplayerPageClient />;
}
