'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { curriculumModules, type CurriculumModule } from '../curriculum-data';
import StudioAudioPlayer from '../components/StudioAudioPlayer';
import { studioTTS } from '../lib/tts-service';
import { useActiveUser } from '../lib/session';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';

type AgeTrack = 'all' | 'early' | 'pathfinder' | 'teen' | 'family';

const MODULES_PER_PAGE = 6;

function numberRange(start: number, end: number): number[] {
  const out: number[] = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
}

function paginationRange(current: number, total: number, siblingCount = 1): (number | 'dots')[] {
  const totalPageNumbers = siblingCount * 2 + 5;
  if (totalPageNumbers >= total) return numberRange(1, total);

  const leftSibling = Math.max(current - siblingCount, 1);
  const rightSibling = Math.min(current + siblingCount, total);
  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < total - 2;

  if (!showLeftDots && showRightDots) {
    const leftRange = numberRange(1, 3 + siblingCount * 2);
    return [...leftRange, 'dots', total];
  }
  if (showLeftDots && !showRightDots) {
    const rightRange = numberRange(total - (3 + siblingCount * 2) + 1, total);
    return [1, 'dots', ...rightRange];
  }
  return [1, 'dots', ...numberRange(leftSibling, rightSibling), 'dots', total];
}

function ModuleArtworkScene({ mod, isModal = false }: { mod: CurriculumModule; isModal?: boolean }) {
  const imageSrc = mod.artworkUrl || (
    mod.track === 'early' ? '/art-lantern-explorers.jpg' :
    mod.track === 'pathfinder' ? '/art-brave-pathfinders.jpg' :
    mod.track === 'teen' ? '/art-lions-den.jpg' :
    '/art-family-quest.jpg'
  );

  return (
    <div className={isModal ? 'scripture-modal-artwork-hero' : 'module-artwork-banner'}>
      <Image
        src={imageSrc}
        alt={mod.characterBadge || mod.title}
        width={isModal ? 680 : 460}
        height={isModal ? 220 : 190}
        className={isModal ? 'scripture-modal-hero-img' : 'module-banner-img'}
        priority={false}
      />
      <div className={`${isModal ? 'scripture-modal-character-pill' : 'module-character-pill'} ${mod.badgeTone || 'gold'}`}>
        <span className="character-emoji">{mod.badgeEmoji || '📖'}</span>
        <span className="character-name">{mod.characterBadge || 'Scripture Quest'}</span>
      </div>
    </div>
  );
}

export default function CurriculumPage() {
  const router = useRouter();
  const { activeUser, hydrated } = useActiveUser();
  const [selectedTrack, setSelectedTrack] = useState<AgeTrack>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const gridRef = useRef<HTMLDivElement>(null);
  const [activeModalModule, setActiveModalModule] = useState<CurriculumModule | null>(null);

  function launchModule(mod: CurriculumModule) {
    studioTTS.stop();
    router.push(`/learn?module=${mod.id}`);
  }

  function goToSignIn(path: string, mod: CurriculumModule) {
    studioTTS.stop();
    try {
      sessionStorage.setItem('lanternLionPendingModuleRedirect', `/learn?module=${mod.id}`);
    } catch { /* Storage unavailable; sign-in flow still works without resume. */ }
    router.push(path);
  }

  const filteredModules =
    selectedTrack === 'all'
      ? curriculumModules
      : curriculumModules.filter((m) => m.track === selectedTrack);
  const totalPages = Math.max(1, Math.ceil(filteredModules.length / MODULES_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const visibleModules = filteredModules.slice((safePage - 1) * MODULES_PER_PAGE, safePage * MODULES_PER_PAGE);
  const pageNumbers = paginationRange(safePage, totalPages);

  function selectTrack(track: AgeTrack) {
    setSelectedTrack(track);
    setCurrentPage(1);
  }

  function goToPage(page: number) {
    const next = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(next);
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const counts = {
    all: curriculumModules.length,
    early: curriculumModules.filter((m) => m.track === 'early').length,
    pathfinder: curriculumModules.filter((m) => m.track === 'pathfinder').length,
    teen: curriculumModules.filter((m) => m.track === 'teen').length,
    family: curriculumModules.filter((m) => m.track === 'family').length,
  };

  return (
    <main className="public-subpage">
      <SiteHeader activeNav="curriculum" />

      {/* ── HERO BANNER ─────────────────────────────────── */}
      <section className="page-hero">
        <div className="page-hero-shell">
          <p className="eyebrow"><span aria-hidden="true">●</span> Full Scope &amp; Sequence Roadmap</p>
          <h1>Scripture learning crafted<br className="hide-mobile" /> for every age &amp; stage.</h1>
          <p className="page-hero-lead">
            Explore our expansive curriculum roadmap designed to grow with your child from preschool through high school. Each module pairs Scripture texts with real-life decision quests and memory mastery.
          </p>

          <div className="curriculum-filter-tabs" role="tablist" aria-label="Curriculum age tracks">
            <button className={selectedTrack === 'all' ? 'active' : ''} onClick={() => selectTrack('all')}>
              All Tracks ({counts.all})
            </button>
            <button className={selectedTrack === 'early' ? 'active' : ''} onClick={() => selectTrack('early')}>
              🏮 Lantern Explorers · Ages 3–5 ({counts.early})
            </button>
            <button className={selectedTrack === 'pathfinder' ? 'active' : ''} onClick={() => selectTrack('pathfinder')}>
              🧭 Brave Pathfinders · Ages 6–10 ({counts.pathfinder})
            </button>
            <button className={selectedTrack === 'teen' ? 'active' : ''} onClick={() => selectTrack('teen')}>
              🦁 The Lion’s Den · Ages 11–16+ ({counts.teen})
            </button>
            <button className={selectedTrack === 'family' ? 'active' : ''} onClick={() => selectTrack('family')}>
              🌟 All-Age Family Quests ({counts.family})
            </button>
          </div>
        </div>
      </section>

      {/* ── CURRICULUM MODULES GRID ─────────────────────── */}
      <section className="curriculum-content-section">
        <div className="curriculum-grid" ref={gridRef}>
          {visibleModules.map((mod) => (
            <article key={mod.id} className="module-card">
              <ModuleArtworkScene mod={mod} />

              <div className="module-header">
                <div className="module-age-group">
                  <span className="module-tag">{mod.ageBandLabel}</span>
                  <span className="module-rec-age">{mod.recommendedAge}</span>
                </div>
                <span className="module-theme">{mod.theme}</span>
              </div>

              <h2>{mod.title}</h2>
              {mod.visualVignette && <p className="module-visual-vignette">{mod.visualVignette}</p>}
              <p className="module-desc">{mod.description}</p>
              
              <div className="module-meta-box">
                <div>
                  <small>Bible Books</small>
                  <strong>{mod.bibleBooks}</strong>
                </div>
                <div>
                  <small>Anchor Verse</small>
                  <strong>{mod.coreVerse}</strong>
                </div>
              </div>

              <div className="module-lessons">
                <h4>Key Lessons &amp; Quests:</h4>
                <ul>
                  {mod.keyLessons.map((lesson) => (
                    <li key={lesson}>
                      <span>✓</span> {lesson}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="module-real-world">
                <h4>🌍 Real-Life Connection</h4>
                <p>{mod.realWorldConnection}</p>
              </div>

              <div className="module-actions">
                <button className="module-preview-btn" onClick={() => setActiveModalModule(mod)}>
                  📖 Read Scripture &amp; Preview Quest →
                </button>
              </div>
            </article>
          ))}
        </div>
        {totalPages > 1 && (
          <nav className="curriculum-pagination" aria-label="Curriculum pages">
            <button
              type="button"
              className="curriculum-page-btn curriculum-page-nav"
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage === 1}
            >
              ← Previous
            </button>
            <div className="curriculum-page-numbers">
              {pageNumbers.map((page, index) =>
                page === 'dots' ? (
                  <span key={`dots-${index}`} className="curriculum-page-dots" aria-hidden="true">…</span>
                ) : (
                  <button
                    key={page}
                    type="button"
                    className={`curriculum-page-btn${page === safePage ? ' active' : ''}`}
                    aria-current={page === safePage ? 'page' : undefined}
                    onClick={() => goToPage(page)}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
            <button
              type="button"
              className="curriculum-page-btn curriculum-page-nav"
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage === totalPages}
            >
              Next →
            </button>
          </nav>
        )}
      </section>

      {/* ── SCRIPTURE PREVIEW MODAL ─────────────────────── */}
      {activeModalModule && (
        <div
          className="help-overlay"
          role="presentation"
          onClick={() => {
            setActiveModalModule(null);
          }}
        >
          <section
            className="help-dialog scripture-reader-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-help"
              aria-label="Close"
              onClick={() => {
                setActiveModalModule(null);
              }}
            >
              ×
            </button>

            <ModuleArtworkScene mod={activeModalModule} isModal={true} />

            <p className="child-kicker">{activeModalModule.ageBandLabel} · {activeModalModule.recommendedAge}</p>
            <h2>{activeModalModule.coreVerse}</h2>

            <div className="scripture-modal-header-row">
              <div className="scripture-modal-translation">World English Bible (WEB) · Core Scripture Passage</div>
            </div>

            <StudioAudioPlayer
              text={`${activeModalModule.coreVerse}. ${activeModalModule.corePassage}. Reflection: ${activeModalModule.description}. Real-life connection: ${activeModalModule.realWorldConnection}`}
              title={`${activeModalModule.characterBadge} Scripture Reading`}
              subtitle="Listen with Google Cloud Studio & Journey narration"
              defaultVoiceId={activeModalModule.track === 'teen' ? 'en-GB-Journey-D' : 'en-GB-Journey-F'}
            />
            
            <div className="scripture-passage-box">
              <p>{activeModalModule.corePassage}</p>
            </div>

            <div className="scripture-modal-insight">
              <span className="insight-badge">💡 Lesson Purpose &amp; Growth</span>
              <p>{activeModalModule.description}</p>
            </div>

            <div className="scripture-modal-insight scripture-modal-real-world">
              <span className="insight-badge">🌍 Real-Life Connection</span>
              <p>{activeModalModule.realWorldConnection}</p>
            </div>

            {hydrated && activeUser ? (
              <div className="scripture-modal-actions">
                <button type="button" className="button button-primary" onClick={() => launchModule(activeModalModule)}>
                  Launch learning module →
                </button>
              </div>
            ) : (
              <div className="scripture-modal-signin-gate">
                <p><strong>Sign in to start this lesson.</strong> Your progress is saved to your own profile.</p>
                <div className="scripture-gate-options">
                  <button type="button" onClick={() => goToSignIn('/child-access', activeModalModule)}>
                    <span>C</span>
                    <div><strong>Child sign in</strong><small>Ages 5–12 · Username and 4-digit PIN</small></div>
                  </button>
                  <button type="button" onClick={() => goToSignIn('/teen-access', activeModalModule)}>
                    <span>🦁</span>
                    <div><strong>Teen sign in</strong><small>Ages 13–17 · Lion’s Den</small></div>
                  </button>
                  <button type="button" onClick={() => goToSignIn('/parent-access', activeModalModule)}>
                    <span>P</span>
                    <div><strong>Parent sign in</strong><small>Family dashboard &amp; controls</small></div>
                  </button>
                  <button type="button" onClick={() => goToSignIn('/teacher-access', activeModalModule)}>
                    <span>T</span>
                    <div><strong>Teacher sign in</strong><small>Class &amp; lesson management</small></div>
                  </button>
                </div>
                <p className="scripture-gate-footnote">
                  New here?{' '}
                  <button type="button" className="scripture-gate-link" onClick={() => goToSignIn('/parent-access', activeModalModule)}>
                    Create a family account →
                  </button>
                </p>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── CURRICULUM CTA BANNER ───────────────────────── */}
      <section className="join-section">
        <div>
          <p className="kicker">Full Library Access</p>
          <h2>Bring this complete Bible journey to your home or church.</h2>
          <p>Start with one family account or test out the child experience with zero setup.</p>
        </div>
        <div className="cta-actions">
          <Link className="button button-primary" href="/family-setup">
            Set up your family
          </Link>
          <Link className="button button-secondary" href="/parent-access">
            Create family account
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <SiteFooter />
    </main>
  );
}
