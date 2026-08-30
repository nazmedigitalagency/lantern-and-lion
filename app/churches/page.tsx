import type { Metadata } from 'next';
import ChurchesPageClient from './ChurchesPageClient';

export const metadata: Metadata = {
  title: "Bible Games for Sunday School & Children's Ministry | Lantern & Lion",
  description:
    'Connect Sunday teaching with Monday living. Bible games, curriculum and team challenges that churches and Christian schools can use with kids and teens.',
  alternates: { canonical: '/churches' },
  openGraph: {
    title: "Bible Games for Sunday School & Children's Ministry | Lantern & Lion",
    description: 'Connect Sunday teaching with Monday living. Bible games and curriculum for churches, Sunday schools and Christian schools.',
    url: '/churches',
  },
  twitter: {
    title: "Bible Games for Sunday School & Children's Ministry | Lantern & Lion",
    description: 'Connect Sunday teaching with Monday living. Bible games and curriculum for churches, Sunday schools and Christian schools.',
  },
};

export default function Page() {
  return <ChurchesPageClient />;
}
