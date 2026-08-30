import type { Metadata } from 'next';
import LearnPageClient from './LearnPageClient';

export const metadata: Metadata = {
  title: 'Bible Learning Activities for Kids | Lantern & Lion',
  description:
    'Bible reading, memory verses and creative activities that help children explore Scripture at their own pace.',
  alternates: { canonical: '/learn' },
  openGraph: {
    title: 'Bible Learning Activities for Kids | Lantern & Lion',
    description: 'Bible reading, memory verses and creative activities that help children explore Scripture at their own pace.',
    url: '/learn',
  },
  twitter: {
    title: 'Bible Learning Activities for Kids | Lantern & Lion',
    description: 'Bible reading, memory verses and creative activities that help children explore Scripture at their own pace.',
  },
};

export default function Page() {
  return <LearnPageClient />;
}
