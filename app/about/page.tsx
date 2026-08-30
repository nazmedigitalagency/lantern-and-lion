import type { Metadata } from 'next';
import AboutPageClient from './AboutPageClient';

export const metadata: Metadata = {
  title: "Our Mission: Bible Learning Kids Actually Love | Lantern & Lion",
  description:
    "Lantern & Lion exists to form children in God's Word with joy and courage. Learn about our mission, values and approach to Christian learning for families.",
  alternates: { canonical: '/about' },
  openGraph: {
    title: "Our Mission: Bible Learning Kids Actually Love | Lantern & Lion",
    description: "Lantern & Lion exists to form children in God's Word with joy and courage.",
    url: '/about',
  },
  twitter: {
    title: "Our Mission: Bible Learning Kids Actually Love | Lantern & Lion",
    description: "Lantern & Lion exists to form children in God's Word with joy and courage.",
  },
};

export default function Page() {
  return <AboutPageClient />;
}
