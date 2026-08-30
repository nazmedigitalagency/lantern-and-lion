import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { blogPosts } from '../blog-data';

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
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Lantern and Lion home">
          <Image src="/lantern-lion-logo.png" alt="" width={58} height={58} />
          <span><strong>Lantern &amp; Lion</strong><small>Bible play for growing minds</small></span>
        </Link>
        <nav>
          <Link href="/curriculum">Curriculum</Link>
          <Link href="/arcade">Games</Link>
          <Link href="/churches">Churches &amp; Schools</Link>
          <Link className="active-nav" href="/blog">Blog</Link>
        </nav>
        <div className="header-actions">
          <Link className="button button-primary" href="/parent-access">Get started</Link>
        </div>
      </header>

      <section style={{ padding: '56px max(24px,calc((100vw - 1192px)/2)) 20px' }}>
        <p className="eyebrow"><span>✎</span>The Lantern &amp; Lion Blog</p>
        <h1 style={{ fontSize: 'clamp(36px,4vw,52px)' }}>Bible learning ideas for families and ministry</h1>
        <p className="hero-lead">Practical thinking on Bible games, Sunday school and Christian parenting — written for parents, teachers and children&rsquo;s ministry leaders.</p>
      </section>

      <section style={{ padding: '20px max(24px,calc((100vw - 1192px)/2)) 80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
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
      </section>

      <footer>
        <div className="footer-brand">
          <Image src="/lantern-lion-logo.png" alt="" width={76} height={76} />
          <div><strong>Lantern &amp; Lion</strong><p>Bible play for growing minds.</p></div>
        </div>
        <div>
          <b>Explore</b>
          <Link href="/curriculum">Curriculum</Link>
          <Link href="/arcade">Bible games</Link>
          <Link href="/churches">Churches &amp; Schools</Link>
        </div>
        <div>
          <b>Sign in</b>
          <Link href="/parent-access">Parent sign in</Link>
          <Link href="/teacher-access">Teacher sign in</Link>
        </div>
        <div>
          <b>Safety &amp; Mission</b>
          <Link href="/safety">Family safety promises</Link>
          <Link href="/about">Our Faith &amp; Mission</Link>
        </div>
        <p className="copyright">© 2026 Lantern &amp; Lion. Built with care for families.</p>
      </footer>
    </main>
  );
}
