import type { Metadata } from 'next';
import CurriculumPageClient from './CurriculumPageClient';

export const metadata: Metadata = {
  title: 'Bible Curriculum for Kids & Teens | Lantern & Lion',
  description:
    'Scripture learning crafted for every age and stage — 80+ Bible modules covering key stories, verses and real-life application for children and teenagers.',
  alternates: { canonical: '/curriculum' },
  openGraph: {
    title: 'Bible Curriculum for Kids & Teens | Lantern & Lion',
    description: 'Scripture learning crafted for every age and stage — Bible modules covering key stories, verses and real-life application.',
    url: '/curriculum',
  },
  twitter: {
    title: 'Bible Curriculum for Kids & Teens | Lantern & Lion',
    description: 'Scripture learning crafted for every age and stage — Bible modules covering key stories, verses and real-life application.',
  },
};

export default function Page() {
  return <CurriculumPageClient />;
}
