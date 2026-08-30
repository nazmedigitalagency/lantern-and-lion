import type { Metadata } from 'next';
import SafetyPageClient from './SafetyPageClient';

export const metadata: Metadata = {
  title: 'Safe Bible App for Kids | Lantern & Lion',
  description:
    "Built to protect your child's attention and heart. See how Lantern & Lion keeps Bible learning safe, private and parent-guided.",
  alternates: { canonical: '/safety' },
  openGraph: {
    title: 'Safe Bible App for Kids | Lantern & Lion',
    description: "Built to protect your child's attention and heart — a safe, private, parent-guided Bible learning app.",
    url: '/safety',
  },
  twitter: {
    title: 'Safe Bible App for Kids | Lantern & Lion',
    description: "Built to protect your child's attention and heart — a safe, private, parent-guided Bible learning app.",
  },
};

export default function Page() {
  return <SafetyPageClient />;
}
