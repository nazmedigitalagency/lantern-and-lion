import type { Metadata } from 'next';
import Link from 'next/link';
import { blogPosts } from '../blog-data';
import SiteFooter from '../components/SiteFooter';
import SiteHeader from '../components/SiteHeader';

export const metadata: Metadata = {
  title: 'Bible Learning Ideas for Families & Ministry | Lantern & Lion Blog',
  description:
    'Practical, non-fluffy ideas on Bible games, Sunday school activities and Christian parenting — written for parents, teachers and children\'s ministry leaders.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Bible Learning Ideas for Families & Ministry | Lantern & Lion Blog',
    description: 'Practical ideas on Bible games, Sunday school activities and Christian parenting.',
    url: '/blog',
  },
};

export default function BlogIndexPage() {
  return (
    <main className="public-subpage">
      <SiteHeader activeNav="blog" />

      <section className="blog-index-hero">
        <p className="eyebrow"><span>✎</span>The Lantern &amp; Lion Blog</p>
        <h1 style={{ fontSize: 'clamp(32px,4vw,52px)' }}>Bible learning ideas for families and ministry</h1>
        <p className="hero-lead">Practical thinking on Bible games, Sunday school and Christian parenting — written for parents, teachers and children&rsquo;s ministry leaders.</p>
      </section>

      <section className="blog-index-grid-wrap">
        <div className="blog-index-grid">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              style={{ display: 'block', padding: 24, border: '2px solid var(--navy)', borderRadius: 18, background: 'var(--white)', boxShadow: '6px 6px 0 var(--navy)' }}
            >
              <p style={{ margin: '0 0 8px', color: 'var(--teal-dark)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                {post.category} · {post.readingTime}
              </p>
              <h2 style={{ margin: '0 0 10px', fontFamily: 'var(--font-fredoka)', fontSize: 22 }}>{post.title}</h2>
              <p style={{ margin: 0, color: '#3d566b', fontSize: 15 }}>{post.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
