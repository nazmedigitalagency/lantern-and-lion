import type { Metadata } from 'next';
import ArcadePageClient from './ArcadePageClient';

export const metadata: Metadata = {
  title: 'Bible Games for Kids | Lantern & Lion',
  description:
    'Games that make Scripture stick. Play Bible-based quizzes, mazes, memory games and story adventures built for children and teens.',
  alternates: { canonical: '/arcade' },
  openGraph: {
    title: 'Bible Games for Kids | Lantern & Lion',
    description: 'Games that make Scripture stick — Bible quizzes, mazes, memory games and story adventures for kids and teens.',
    url: '/arcade',
  },
  twitter: {
    title: 'Bible Games for Kids | Lantern & Lion',
    description: 'Games that make Scripture stick — Bible quizzes, mazes, memory games and story adventures for kids and teens.',
  },
};

export default function Page() {
  return <ArcadePageClient />;
}
