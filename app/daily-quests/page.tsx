import type { Metadata } from 'next';
import DailyQuestsPageClient from './DailyQuestsPageClient';

export const metadata: Metadata = {
  title: 'Daily Quests | Lantern & Lion',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <DailyQuestsPageClient />;
}
