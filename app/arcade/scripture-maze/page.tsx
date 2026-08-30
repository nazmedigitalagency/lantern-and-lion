import type { Metadata } from 'next';
import ScriptureMazePageClient from './ScriptureMazePageClient';

export const metadata: Metadata = {
  title: 'Scripture Maze | Lantern & Lion',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ScriptureMazePageClient />;
}
