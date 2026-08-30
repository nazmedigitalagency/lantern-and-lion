import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { curriculumModules, type CurriculumModule } from '../../curriculum-data';
import { SITE_URL } from '../../lib/site';

export function generateStaticParams() {
  return curriculumModules.map((mod) => ({ id: mod.id }));
}

function getModule(id: string): CurriculumModule | undefined {
  return curriculumModules.find((mod) => mod.id === id);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const mod = getModule(id);
  if (!mod) return { title: 'Lesson Not Found | Lantern & Lion' };

  const title = `${mod.title} — Bible Lesson for ${mod.ageBandLabel} | Lantern & Lion`;
  const description = mod.description.length > 155 ? `${mod.description.slice(0, 152)}...` : mod.description;

  return {
    title,
    description,
    alternates: { canonical: `/curriculum/${mod.id}` },
    openGraph: {
      title,
      description,
      url: `/curriculum/${mod.id}`,
      images: [{ url: mod.artworkUrl }],
    },
    twitter: { title, description, images: [mod.artworkUrl] },
  };
}

const trackHome: Record<CurriculumModule['track'], string> = {
  early: '/art-lantern-explorers.jpg',
  pathfinder: '/art-brave-pathfinders.jpg',
  teen: '/art-lions-den.jpg',
  family: '/art-family-quest.jpg',
};

export default async function CurriculumLessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mod = getModule(id);
  if (!mod) notFound();

  const related = curriculumModules.filter((m) => m.track === mod.track && m.id !== mod.id).slice(0, 3);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Curriculum', item: `${SITE_URL}/curriculum` },
      { '@type': 'ListItem', position: 3, name: mod.title, item: `${SITE_URL}/curriculum/${mod.id}` },
    ],
  };

  const lessonJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: mod.title,
    description: mod.description,
    about: mod.bibleBooks,
    educationalLevel: mod.ageBandLabel,
    isFamilyFriendly: true,
    image: `${SITE_URL}${mod.artworkUrl}`,
    url: `${SITE_URL}/curriculum/${mod.id}`,
    provider: { '@type': 'Organization', name: 'Lantern & Lion', url: SITE_URL },
  };

  return (
    <main className="public-subpage">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(lessonJsonLd) }} />

      <header className="site-header">
        <Link className="brand" href="/" aria-label="Lantern and Lion home">
          <Image src="/lantern-lion-logo.png" alt="" width={58} height={58} />
          <span><strong>Lantern &amp; Lion</strong><small>Bible play for growing minds</small></span>
        </Link>
        <nav>
          <Link href="/curriculum">Curriculum</Link>
          <Link href="/arcade">Games</Link>
          <Link href="/churches">Churches &amp; Schools</Link>
          <Link href="/safety">Safety</Link>
        </nav>
        <div className="header-actions">
          <Link className="button button-primary" href="/parent-access">Get started</Link>
        </div>
      </header>

      <section style={{ padding: '24px max(24px,calc((100vw - 1192px)/2)) 0', fontSize: 14, color: '#52687a' }}>
        <Link href="/curriculum">Curriculum</Link>
        {' › '}
        <span>{mod.title}</span>
      </section>

      <section style={{ padding: '24px max(24px,calc((100vw - 1192px)/2)) 60px', display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 48, alignItems: 'start' }}>
        <div>
          <p className="eyebrow"><span>{mod.badgeEmoji}</span>{mod.ageBandLabel} · {mod.recommendedAge}</p>
          <h1>{mod.title}</h1>
          <p className="hero-lead">{mod.description}</p>

          <div style={{ display: 'grid', gap: 18, margin: '30px 0' }}>
            <div>
              <b style={{ display: 'block', color: 'var(--teal-dark)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '.04em' }}>Bible passage</b>
              <p style={{ margin: '4px 0' }}>{mod.bibleBooks} — <em>{mod.coreVerse}</em></p>
              <p style={{ margin: 0, color: '#3d566b' }}>&ldquo;{mod.corePassage}&rdquo;</p>
            </div>
            <div>
              <b style={{ display: 'block', color: 'var(--teal-dark)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '.04em' }}>Theme</b>
              <p style={{ margin: '4px 0' }}>{mod.theme}</p>
            </div>
            <div>
              <b style={{ display: 'block', color: 'var(--teal-dark)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '.04em' }}>Real-life connection</b>
              <p style={{ margin: '4px 0', color: '#3d566b' }}>{mod.realWorldConnection}</p>
            </div>
            {mod.keyLessons.length > 0 && (
              <div>
                <b style={{ display: 'block', color: 'var(--teal-dark)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '.04em' }}>What children learn</b>
                <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: '#3d566b' }}>
                  {mod.keyLessons.map((lesson) => <li key={lesson}>{lesson}</li>)}
                </ul>
              </div>
            )}
            {mod.activityTypes.length > 0 && (
              <div>
                <b style={{ display: 'block', color: 'var(--teal-dark)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '.04em' }}>Activities &amp; games</b>
                <p style={{ margin: '4px 0', color: '#3d566b' }}>{mod.activityTypes.join(' · ')}</p>
              </div>
            )}
          </div>

          <div className="hero-actions">
            <Link className="button button-primary" href="/curriculum">Explore the full curriculum</Link>
            <Link className="button button-secondary" href="/parent-access">Start free with your family</Link>
          </div>
        </div>

        <div>
          <Image
            src={mod.artworkUrl}
            alt={mod.visualVignette}
            width={640}
            height={480}
            style={{ width: '100%', height: 'auto', borderRadius: 20, border: '2px solid var(--navy)', boxShadow: '10px 10px 0 var(--navy)' }}
          />
          <Image
            src={trackHome[mod.track]}
            alt=""
            width={640}
            height={240}
            style={{ width: '100%', height: 'auto', borderRadius: 16, marginTop: 20, border: '2px solid var(--navy)' }}
          />
        </div>
      </section>

      {related.length > 0 && (
        <section style={{ padding: '0 max(24px,calc((100vw - 1192px)/2)) 70px' }}>
          <h2 style={{ fontFamily: 'var(--font-fredoka)', fontSize: 28 }}>More lessons in {mod.ageBandLabel}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 20 }}>
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/curriculum/${r.id}`}
                style={{ display: 'block', padding: 20, border: '2px solid var(--navy)', borderRadius: 16, background: 'var(--white)' }}
              >
                <strong style={{ fontFamily: 'var(--font-fredoka)', fontSize: 18 }}>{r.title}</strong>
                <p style={{ margin: '8px 0 0', color: '#3d566b', fontSize: 14 }}>{r.bibleBooks}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer>
        <div className="footer-brand">
          <Image src="/lantern-lion-logo.png" alt="" width={76} height={76} />
          <div><strong>Lantern &amp; Lion</strong><p>Bible play for growing minds.</p></div>
        </div>
        <div>
          <b>Explore</b>
          <Link href="/curriculum">Curriculum</Link>
          <Link href="/arcade">Bible games</Link>
          <Link href="/multiplayer">Team games</Link>
          <Link href="/churches">Churches &amp; Schools</Link>
        </div>
        <div>
          <b>Sign in</b>
          <Link href="/child-access">Child sign in</Link>
          <Link href="/teen-access">Teen sign in</Link>
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
