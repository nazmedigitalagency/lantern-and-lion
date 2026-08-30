import type { Metadata } from 'next';
import ChildAccessPageClient from './ChildAccessPageClient';

export const metadata: Metadata = {
  title: 'Child Sign In | Lantern & Lion',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ChildAccessPageClient />;
}
