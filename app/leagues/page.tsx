import type { Metadata } from 'next';
import LeaguePageClient from './LeaguePageClient';

export const metadata: Metadata = {
  title: 'Bible League & Seasons · Lantern & Lion',
  description:
    'Join your league pod, learn Scripture, climb the leaderboard, earn Lantern Coins and Gems, and celebrate seasonal milestones.',
};

export default function LeaguesPage() {
  return <LeaguePageClient />;
}
