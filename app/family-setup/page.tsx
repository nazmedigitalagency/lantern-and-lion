import type { Metadata } from 'next';
import FamilySetupPageClient from './FamilySetupPageClient';

export const metadata: Metadata = {
  title: 'Family Setup | Lantern & Lion',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <FamilySetupPageClient />;
}
