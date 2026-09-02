import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { curriculumModules, type CurriculumModule } from '../../curriculum-data';
import { SITE_URL } from '../../lib/site';
import SiteFooter from '../../components/SiteFooter';
import SiteHeader from '../../components/SiteHeader';

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

      <SiteHeader activeNav="curriculum" />

      <section style={{ padding: '24px max(24px,calc((100vw - 1192px)/2)) 0', fontSize: 14, color: '#64748B' }}>
        <Link href="/curriculum">Curriculum</Link>
        {' › '}
        <span>{mod.title}</span>
      </section>

      <section className="lesson-detail-section">
        <div className="lesson-detail-grid">
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
        </div>
      </section>

      {related.length > 0 && (
        <section style={{ padding: '0 max(24px,calc((100vw - 1192px)/2)) 70px' }}>
          <h2 style={{ fontFamily: 'var(--font-fredoka)', fontSize: 28 }}>More lessons in {mod.ageBandLabel}</h2>
          <div className="lesson-related-grid">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/curriculum/${r.id}`}
                style={{ display: 'block', padding: 20, border: '2px solid var(--navy)', borderRadius: 16, background: 'var(--white)', boxShadow: '4px 4px 0 var(--navy)' }}
              >
                <strong style={{ fontFamily: 'var(--font-fredoka)', fontSize: 18 }}>{r.title}</strong>
                <p style={{ margin: '8px 0 0', color: '#3d566b', fontSize: 14 }}>{r.bibleBooks}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <SiteFooter />
    </main>
  );
}
