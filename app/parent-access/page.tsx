import type { Metadata } from 'next';
import ParentAccessPageClient from './ParentAccessPageClient';

export const metadata: Metadata = {
  title: 'Parent Sign In | Lantern & Lion',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ParentAccessPageClient />;
}
