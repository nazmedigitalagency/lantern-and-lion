import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { blogPosts, getBlogPost } from '../../blog-data';
import { SITE_URL } from '../../lib/site';
import SiteFooter from '../../components/SiteFooter';
import SiteHeader from '../../components/SiteHeader';

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: 'Article Not Found | Lantern & Lion' };

  const title = `${post.title} | Lantern & Lion Blog`;
  return {
    title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { title, description: post.description, url: `/blog/${post.slug}`, type: 'article' },
    twitter: { title, description: post.description },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const related = blogPosts.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, 2);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    author: { '@type': 'Organization', name: 'Lantern & Lion' },
    publisher: { '@type': 'Organization', name: 'Lantern & Lion', url: SITE_URL },
    url: `${SITE_URL}/blog/${post.slug}`,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${SITE_URL}/blog/${post.slug}` },
    ],
  };

  return (
    <main className="public-subpage">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <SiteHeader activeNav="blog" />

      <article className="blog-article-shell">
        <p style={{ margin: 0, fontSize: 14 }}><Link href="/blog">Blog</Link> {' › '} <span>{post.category}</span></p>
        <p className="eyebrow" style={{ marginTop: 18 }}><span>✎</span>{post.category} · {post.readingTime}</p>
        <h1 style={{ fontSize: 'clamp(32px,4vw,48px)' }}>{post.title}</h1>
        <p className="hero-lead">{post.intro}</p>

        {post.sections.map((section) => (
          <div key={section.heading ?? section.paragraphs[0]} style={{ marginTop: 34 }}>
            {section.heading && (
              <h2 style={{ fontFamily: 'var(--font-fredoka)', fontSize: 24, marginBottom: 12 }}>{section.heading}</h2>
            )}
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} style={{ color: '#3d566b', fontSize: 16, lineHeight: 1.7, margin: '0 0 14px' }}>
                {paragraph}
              </p>
            ))}
          </div>
        ))}

        <div style={{ marginTop: 40, padding: 24, border: '2px solid var(--navy)', borderRadius: 16, background: 'var(--cream)' }}>
          <b style={{ display: 'block', marginBottom: 10, fontFamily: 'var(--font-fredoka)', fontSize: 18 }}>Keep exploring</b>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {post.relatedLinks.map((link) => (
              <Link key={link.href} className="button button-secondary" href={link.href}>{link.label}</Link>
            ))}
          </div>
        </div>

        {related.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <b style={{ display: 'block', marginBottom: 12, fontFamily: 'var(--font-fredoka)', fontSize: 18 }}>More on {post.category}</b>
            <div style={{ display: 'grid', gap: 12 }}>
              {related.map((r) => (
                <Link key={r.slug} href={`/blog/${r.slug}`} style={{ color: 'var(--teal-dark)', fontWeight: 800 }}>
                  {r.title} →
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

      <SiteFooter />
    </main>
  );
}
