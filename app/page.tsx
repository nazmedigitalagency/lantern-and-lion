import type { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: 'Christian Bible Learning Games for Kids & Teens | Lantern & Lion',
  description:
    'Bible play for growing minds. Safe Bible stories, games and real-life choices for children and teens, with parents close by.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Christian Bible Learning Games for Kids & Teens | Lantern & Lion',
    description: 'Bible play for growing minds. Safe Bible stories, games and real-life choices for children and teens, with parents close by.',
    url: '/',
  },
  twitter: {
    title: 'Christian Bible Learning Games for Kids & Teens | Lantern & Lion',
    description: 'Bible play for growing minds. Safe Bible stories, games and real-life choices for children and teens, with parents close by.',
  },
};

export default function Page() {
  return <HomeClient />;
}
