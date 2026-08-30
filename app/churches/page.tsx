'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

type ActiveUser = {
  persona: 'child' | 'teen' | 'parent' | 'teacher';
  name: string;
  roleLabel: string;
  dashboardUrl: string;
  avatarTone: string;
  avatarChar: string;
};

export default function ChurchesPage() {
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
    } else if (activeUser?.persona === 'teen') {
      localStorage.removeItem('lanternLionTeenSession');
    } else if (activeUser?.persona === 'parent') {
      localStorage.removeItem('lanternLionDemoSession');
    } else if (activeUser?.persona === 'teacher') {
      localStorage.removeItem('lanternLionTeacherSession');
    }
    setActiveUser(null);
    setUserDropdownOpen(false);
    setMenuOpen(false);
  }

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
          <Link href="/curriculum">Curriculum</Link>
          <Link href="/safety">Safety</Link>
          <Link className="active-nav" href="/churches">Churches &amp; Schools</Link>
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
          <p className="eyebrow"><span aria-hidden="true">●</span> Sunday Schools &amp; Christian Classrooms</p>
          <h1>Connect Sunday teaching<br className="hide-mobile" /> with Monday living.</h1>
          <p className="page-hero-lead">
            Equip Sunday School volunteers, Christian school educators, and youth leaders with synchronized classroom tools, group multiplayer trivia, and direct parent take-home bridges.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/teacher-access">
              Open Teacher Space →
            </Link>
            <Link className="button button-secondary" href="/multiplayer">
              Try a live team quest
            </Link>
          </div>
        </div>
      </section>

      {/* ── TEACHER CAPABILITIES ────────────────────────── */}
      <section className="church-features-section">
        <div className="church-grid">
          <article className="church-card">
            <div className="church-icon gold">🏷️</div>
            <h3>Simple 8-Character Join Codes</h3>
            <p>
              Generate instant classroom codes (e.g. <code>LIGHT-482</code>, <code>LION-482</code>). Students connect with one tap on their tablets or family phones with zero account friction.
            </p>
          </article>

          <article className="church-card">
            <div className="church-icon teal">📺</div>
            <h3>Big-Screen Team Trivia Quests</h3>
            <p>
              Project synchronous team games onto the sanctuary or classroom screen. Split the class into Lanterns and Lions for collaborative, noise-friendly Bible exploration.
            </p>
          </article>

          <article className="church-card">
            <div className="church-icon coral">🏡</div>
            <h3>The Home-Church Bridge</h3>
            <p>
              When a student finishes a Sunday quest in class, their parents can see the memory verse and dinner table conversation prompt right inside their parent dashboard.
            </p>
          </article>

          <article className="church-card">
            <div className="church-icon sky">📊</div>
            <h3>Roster &amp; Assignment Tracking</h3>
            <p>
              See which stories were completed, where students had questions, and send warm encouragement without reading over shoulders.
            </p>
          </article>
        </div>
      </section>

      {/* ── CLASSROOM DEMO PREVIEW ──────────────────────── */}
      <section className="church-demo-section">
        <div className="church-demo-shell">
          <div className="section-heading">
            <p className="kicker">Live Classroom Integration</p>
            <h2>How Teachers Use Lantern &amp; Lion Every Week</h2>
          </div>

          <div className="church-demo-card">
            <div className="demo-step">
              <span className="step-num">1</span>
              <div>
                <strong>Sunday 9:45 AM: Big Screen Lesson</strong>
                <p>Teacher Grace opens <em>1 Samuel 17 (David chooses courage)</em> on the classroom screen. The group reads together with interactive sound waves.</p>
              </div>
            </div>

            <div className="demo-step">
              <span className="step-num">2</span>
              <div>
                <strong>Sunday 10:15 AM: Split Team Quest</strong>
                <p>Students tap into room <code>LIGHT-482</code>. Lanterns and Lions answer questions together with preset cheer stamps.</p>
              </div>
            </div>

            <div className="demo-step">
              <span className="step-num">3</span>
              <div>
                <strong>Sunday 12:30 PM: Family Dinner Table</strong>
                <p>Parents see the memory verse <em>Psalm 56:3</em> in their Parent Space and ask their kids about the story over lunch.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────── */}
      <section className="join-section">
        <div>
          <p className="kicker">Sunday School Leaders &amp; Teachers</p>
          <h2>Bring Lantern &amp; Lion to your church or school.</h2>
          <p>Launch your teacher space in under 30 seconds with complete lesson libraries.</p>
        </div>
        <div className="cta-actions">
          <Link className="button button-primary" href="/teacher-access">
            Launch Teacher Space →
          </Link>
          <Link className="button button-secondary" href="/parent-access">
            Parent &amp; Family Access
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
