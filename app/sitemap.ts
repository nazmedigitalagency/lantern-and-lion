import type { MetadataRoute } from 'next';
import { curriculumModules } from './curriculum-data';
import { blogPosts } from './blog-data';
import { SITE_URL } from './lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/curriculum`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/arcade`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/learn`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/multiplayer`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/churches`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/safety`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/blog`, changeFrequency: 'weekly', priority: 0.7 },
  ];

  const curriculumRoutes: MetadataRoute.Sitemap = curriculumModules.map((mod) => ({
    url: `${SITE_URL}/curriculum/${mod.id}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    changeFrequency: 'monthly',
    priority: 0.5,
    lastModified: post.publishedAt,
  }));

  return [...staticRoutes, ...curriculumRoutes, ...blogRoutes];
}
