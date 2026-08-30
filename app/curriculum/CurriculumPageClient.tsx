'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { curriculumModules, type CurriculumModule } from '../curriculum-data';
import StudioAudioPlayer from '../components/StudioAudioPlayer';
import { studioTTS } from '../lib/tts-service';

type ActiveUser = {
  persona: 'child' | 'teen' | 'parent' | 'teacher';
  name: string;
  roleLabel: string;
  dashboardUrl: string;
  avatarTone: string;
  avatarChar: string;
};

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
  const [selectedTrack, setSelectedTrack] = useState<AgeTrack>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const gridRef = useRef<HTMLDivElement>(null);
  const [activeModalModule, setActiveModalModule] = useState<CurriculumModule | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<ActiveUser | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const childSession = JSON.parse(localStorage.getItem('lanternLionChildSession') || 'null');
        const teenSession = JSON.parse(localStorage.getItem('lanternLionTeenSession') || 'null');
        const parentSession = JSON.parse(localStorage.getItem('lanternLionDemoSession') || 'null');
        const teacherSession = JSON.parse(localStorage.getItem('lanternLionTeacherSession') || 'null');

        if (childSession?.name) {
          setActiveUser({
            persona: 'child',
            name: childSession.name,
            roleLabel: 'Child Space',
            dashboardUrl: '/child-dashboard',
            avatarTone: 'gold',
            avatarChar: childSession.name[0]?.toUpperCase() || 'C',
          });
        } else if (teenSession?.name) {
          setActiveUser({
            persona: 'teen',
            name: teenSession.name,
            roleLabel: 'Lion’s Den Space',
            dashboardUrl: '/teen-dashboard',
            avatarTone: 'gold',
            avatarChar: teenSession.name[0]?.toUpperCase() || 'T',
          });
        } else if (parentSession?.name) {
          setActiveUser({
            persona: 'parent',
            name: parentSession.name,
            roleLabel: 'Parent Space',
            dashboardUrl: '/parent-dashboard',
            avatarTone: 'coral',
            avatarChar: parentSession.name[0]?.toUpperCase() || 'P',
          });
        } else if (teacherSession?.name) {
          setActiveUser({
            persona: 'teacher',
            name: teacherSession.name,
            roleLabel: 'Teacher Space',
            dashboardUrl: '/teacher-dashboard',
            avatarTone: 'teal',
            avatarChar: teacherSession.name[0]?.toUpperCase() || 'T',
          });
        }
      } catch { /* No active user */ }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function handleSignOut() {
    if (activeUser?.persona === 'child') {
      localStorage.removeItem('lanternLionChildSession');
      localStorage.removeItem('lanternLionActiveChildId');
    } else if (activeUser?.persona === 'teen') {
      localStorage.removeItem('lanternLionTeenSession');
      localStorage.removeItem('lanternLionActiveChildId');
    } else if (activeUser?.persona === 'parent') {
      localStorage.removeItem('lanternLionDemoSession');
    } else if (activeUser?.persona === 'teacher') {
      localStorage.removeItem('lanternLionTeacherSession');
    }
    setActiveUser(null);
    setUserDropdownOpen(false);
    setMenuOpen(false);
  }

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
      {/* ── HEADER ──────────────────────────────────────── */}
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Lantern and Lion home">
          <Image src="/lantern-lion-logo.png" alt="" width={58} height={58} priority />
          <span>
            <strong>Lantern &amp; Lion</strong>
            <small>The Lantern Club</small>
          </span>
        </Link>

        <nav id="main-nav" aria-label="Main navigation">
          <Link className="active-nav" href="/curriculum">Curriculum</Link>
          <Link href="/safety">Safety</Link>
          <Link href="/churches">Churches &amp; Schools</Link>
          <Link href="/multiplayer">Team games</Link>
          <Link href="/about">Our Mission</Link>
        </nav>

        <div className="header-actions">
          {hydrated && activeUser ? (
            <>
              <div className="user-profile-dropdown">
                <button
                  className="user-profile-trigger"
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                >
                  <span className={`user-profile-avatar ${activeUser.avatarTone}`}>{activeUser.avatarChar}</span>
                  <div className="user-profile-text">
                    <strong>{activeUser.name}</strong>
                    <small>{activeUser.roleLabel}</small>
                  </div>
                  <span className={`signin-chevron ${userDropdownOpen ? 'open' : ''}`} aria-hidden="true" />
                </button>
                {userDropdownOpen && (
                  <div className="user-profile-menu" role="menu">
                    <div className="user-menu-header">
                      <span className={`user-menu-avatar ${activeUser.avatarTone}`}>{activeUser.avatarChar}</span>
                      <div>
                        <strong>{activeUser.name}</strong>
                        <small>Signed in ({activeUser.roleLabel})</small>
                      </div>
                    </div>
                    <div className="user-menu-divider" />
                    <Link role="menuitem" className="user-menu-dashboard-link" href={activeUser.dashboardUrl} onClick={() => setUserDropdownOpen(false)}>
                      <span>🚀</span>
                      <div><strong>Open {activeUser.roleLabel}</strong><small>Continue your journey</small></div>
                    </Link>
                    <div className="user-menu-divider" />
                    <button role="menuitem" className="user-menu-signout" onClick={handleSignOut}>
                      <span>🚪</span>
                      <div><strong>Sign out of {activeUser.name}</strong></div>
                    </button>
                  </div>
                )}
              </div>
              <Link className="button button-primary header-dashboard-btn" href={activeUser.dashboardUrl}>
                Dashboard →
              </Link>
            </>
          ) : (
            <>
              <div className="signin-dropdown">
                <button
                  className="signin-trigger"
                  aria-expanded={signInOpen}
                  aria-haspopup="true"
                  onClick={() => setSignInOpen(!signInOpen)}
                >
                  Sign in
                  <span className={`signin-chevron ${signInOpen ? 'open' : ''}`} aria-hidden="true" />
                </button>
                {signInOpen && (
                  <div className="signin-menu" role="menu">
                    <Link role="menuitem" href="/child-access" onClick={() => setSignInOpen(false)}>
                      <span>C</span>
                      <div><strong>Child sign in</strong><small>Ages 5–12 · Username and 4-digit PIN</small></div>
                    </Link>
                    <Link role="menuitem" href="/teen-access" onClick={() => setSignInOpen(false)}>
                      <span>🦁</span>
                      <div><strong>Teen sign in</strong><small>Ages 13–17 · Lion’s Den</small></div>
                    </Link>
                    <Link role="menuitem" href="/parent-access" onClick={() => setSignInOpen(false)}>
                      <span>P</span>
                      <div><strong>Parent sign in</strong><small>Family dashboard &amp; controls</small></div>
                    </Link>
                    <Link role="menuitem" href="/teacher-access" onClick={() => setSignInOpen(false)}>
                      <span>T</span>
                      <div><strong>Teacher sign in</strong><small>Class &amp; lesson management</small></div>
                    </Link>
                  </div>
                )}
              </div>
              <Link className="button button-coral" href="/parent-access">Create account</Link>
            </>
          )}
        </div>

        <button
          className="menu-button"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => { setMenuOpen(!menuOpen); setSignInOpen(false); }}
        >
          <span /><span /><span />
          <b className="sr-only">Menu</b>
        </button>

        {menuOpen && (
          <div className="mobile-nav" id="mobile-nav" role="dialog" aria-label="Main menu">
            {hydrated && activeUser && (
              <div className="mobile-user-box">
                <span className={`user-profile-avatar ${activeUser.avatarTone}`}>{activeUser.avatarChar}</span>
                <div>
                  <strong>{activeUser.name}</strong>
                  <small>{activeUser.roleLabel} (Signed in)</small>
                </div>
              </div>
            )}
            <Link href="/curriculum" onClick={() => setMenuOpen(false)}>Curriculum</Link>
            <Link href="/safety" onClick={() => setMenuOpen(false)}>Safety</Link>
            <Link href="/churches" onClick={() => setMenuOpen(false)}>Churches &amp; Schools</Link>
            <Link href="/multiplayer" onClick={() => setMenuOpen(false)}>Team games</Link>
            <Link href="/about" onClick={() => setMenuOpen(false)}>Our Mission</Link>

            {hydrated && activeUser ? (
              <div className="mobile-user-actions">
                <Link className="button button-primary mobile-create" href={activeUser.dashboardUrl} onClick={() => setMenuOpen(false)}>
                  Open {activeUser.roleLabel} →
                </Link>
                <button className="mobile-signout-link" onClick={handleSignOut}>
                  Sign out of {activeUser.name}
                </button>
              </div>
            ) : (
              <>
                <div className="mobile-signin">
                  <button
                    className="mobile-signin-trigger"
                    aria-expanded={signInOpen}
                    onClick={() => setSignInOpen(!signInOpen)}
                  >
                    Sign in
                    <span className={`signin-chevron ${signInOpen ? 'open' : ''}`} aria-hidden="true" />
                  </button>
                  {signInOpen && (
                    <div className="mobile-signin-submenu">
                      <Link href="/child-access" onClick={() => setMenuOpen(false)}>Child sign in (5–12)</Link>
                      <Link href="/teen-access" onClick={() => setMenuOpen(false)}>Teen sign in (13–17)</Link>
                      <Link href="/parent-access" onClick={() => setMenuOpen(false)}>Parent sign in</Link>
                      <Link href="/teacher-access" onClick={() => setMenuOpen(false)}>Teacher sign in</Link>
                    </div>
                  )}
                </div>
                <Link className="button button-coral mobile-create" href="/parent-access" onClick={() => setMenuOpen(false)}>
                  Create account
                </Link>
              </>
            )}
          </div>
        )}
      </header>

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
      <footer>
        <div className="footer-brand">
          <Image src="/lantern-lion-logo.png" alt="" width={76} height={76} />
          <div><strong>Lantern &amp; Lion</strong><p>Bible play for growing minds.</p></div>
        </div>
        <div>
          <b>Explore</b>
          <Link href="/curriculum">Curriculum</Link>
          <Link href="/learn">All 37+ lessons</Link>
          <Link href="/multiplayer">Team games</Link>
          <Link href="/churches">Churches &amp; Classrooms</Link>
          <Link href="/blog">Blog</Link>
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
          <Link href="/parent-access">Create family account</Link>
        </div>
        <p className="copyright">© 2026 Lantern &amp; Lion. Built with care for families.</p>
      </footer>
    </main>
  );
}
