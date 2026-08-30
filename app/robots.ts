import type { MetadataRoute } from 'next';
import { SITE_URL } from './lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/child-access',
        '/child-dashboard',
        '/parent-access',
        '/parent-dashboard',
        '/teacher-access',
        '/teacher-dashboard',
        '/teen-access',
        '/teen-dashboard',
        '/family-setup',
        '/onboarding',
        '/daily-quests',
        '/character',
        '/adventure',
        '/arcade/bible-detective',
        '/arcade/build-the-story',
        '/arcade/lightning-quiz',
        '/arcade/memory-match',
        '/arcade/scripture-connections',
        '/arcade/scripture-maze',
        '/arcade/scripture-scramble',
        '/arcade/verse-builder',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
