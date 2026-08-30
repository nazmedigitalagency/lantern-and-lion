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

export default function SafetyPage() {
  const [signInOpen, setSignInOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<ActiveUser | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

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

  const faqs = [
    {
      q: 'Do children need an email address to use Lantern & Lion?',
      a: 'No. Children never need an email, phone number, or social media handle. Parents create child profiles under their own family account with just a first name and a 4-digit PIN.',
    },
    {
      q: 'Can strangers message or search for my child?',
      a: 'Never. There are no public user profiles, no search directories, and no free-form text chat anywhere on Lantern & Lion. Multiplayer games only work via private 8-character host codes.',
    },
    {
      q: 'Are there advertisements, in-app purchases, or loot boxes?',
      a: 'None whatsoever. We do not run third-party advertising, nor do we use casino-like gambling mechanics. Rewards are strictly pedagogical (Light Points and Memory Badges).',
    },
    {
      q: 'How does the Parent Security Gate protect my family settings?',
      a: 'All sensitive management features (adding siblings, resetting PINs, updating family names, linking classrooms) require the parent’s password to unlock, even inside the child dashboard.',
    },
  ];

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
          <Link className="active-nav" href="/safety">Safety</Link>
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

      {/* ── SAFETY HERO ─────────────────────────────────── */}
      <section className="page-hero">
        <div className="page-hero-shell">
          <p className="eyebrow"><span aria-hidden="true">●</span> Digital Sanctuary</p>
          <h1>Built to protect your child’s<br className="hide-mobile" /> attention and heart.</h1>
          <p className="page-hero-lead">
            We built Lantern &amp; Lion from the ground up to be the cleanest, safest digital experience your family will ever use. No ads, no public matchmaking, and no algorithms.
          </p>
        </div>
      </section>

      {/* ── 4 PILLARS OF PROTECTION ─────────────────────── */}
      <section className="safety-content-section">
        <div className="safety-pillars-grid">
          <article className="safety-pillar-card">
            <div className="safety-icon-badge gold">🚫</div>
            <h3>100% Ad-Free &amp; No Data Brokers</h3>
            <p>
              We do not sell attention. We will never sell your child’s browsing habits or show commercial advertisements. Our business model is supported directly by loving families and churches.
            </p>
          </article>

          <article className="safety-pillar-card">
            <div className="safety-icon-badge teal">🔒</div>
            <h3>No Stranger Access or Open Chat</h3>
            <p>
              Children cannot receive direct messages, search for other users, or broadcast text publicly. Multiplayer rooms require a private 8-character code shared by their parent or teacher.
            </p>
          </article>

          <article className="safety-pillar-card">
            <div className="safety-icon-badge coral">🔑</div>
            <h3>Parent Gate Security</h3>
            <p>
              Account settings, sibling profiles, and PIN management are shielded behind a parent password. Children can never accidentally change family controls.
            </p>
          </article>

          <article className="safety-pillar-card">
            <div className="safety-icon-badge sky">🌱</div>
            <h3>Calm, Non-Addictive Design</h3>
            <p>
              No infinite feeds, autoplay traps, or coercive notifications. Lessons have clear natural stopping points so scripture time leads into healthy real-world family conversations.
            </p>
          </article>
        </div>
      </section>

      {/* ── COMPARISON TABLE ────────────────────────────── */}
      <section className="comparison-section">
        <div className="comparison-shell">
          <div className="section-heading">
            <p className="kicker">Clear Contrast</p>
            <h2>How We Differ from Typical Kids Apps</h2>
          </div>

          <div className="comparison-table-wrap">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Safety Feature</th>
                  <th>Standard Children’s Media</th>
                  <th>Lantern &amp; Lion</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Advertising</strong></td>
                  <td className="bad">Third-party banner &amp; video ads</td>
                  <td className="good">✓ 100% Ad-free always</td>
                </tr>
                <tr>
                  <td><strong>Social Messaging</strong></td>
                  <td className="bad">Open comment sections &amp; direct chats</td>
                  <td className="good">✓ Private circles &amp; preset encouragement only</td>
                </tr>
                <tr>
                  <td><strong>User Discovery</strong></td>
                  <td className="bad">Searchable usernames &amp; friend suggestions</td>
                  <td className="good">✓ Zero stranger discovery</td>
                </tr>
                <tr>
                  <td><strong>Parental Visibility</strong></td>
                  <td className="bad">Hidden activity logs &amp; separate screens</td>
                  <td className="good">✓ Real-time progress &amp; memory tracking</td>
                </tr>
                <tr>
                  <td><strong>Engagement Loop</strong></td>
                  <td className="bad">Algorithmic streaks &amp; dopamine loops</td>
                  <td className="good">✓ Peaceful story chapters with dinner table prompts</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ACCORDION ───────────────────────────────── */}
      <section className="faq-section">
        <div className="faq-shell">
          <div className="section-heading">
            <p className="kicker">Frequently Asked Questions</p>
            <h2>Parent &amp; Guardian FAQ</h2>
          </div>

          <div className="faq-list">
            {faqs.map((faq, idx) => (
              <article key={faq.q} className="faq-item">
                <button
                  className="faq-question"
                  aria-expanded={expandedFaq === idx}
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                >
                  <span>{faq.q}</span>
                  <span className="faq-chevron">{expandedFaq === idx ? '−' : '+'}</span>
                </button>
                {expandedFaq === idx && (
                  <div className="faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────── */}
      <section className="join-section">
        <div>
          <p className="kicker">Experience True Peace of Mind</p>
          <h2>Give your family a clean, safe sanctuary.</h2>
          <p>Join thousands of parents building lifelong faith with zero compromises.</p>
        </div>
        <div className="cta-actions">
          <Link className="button button-primary" href="/parent-access">
            Create family account
          </Link>
          <Link className="button button-secondary" href="/family-setup">
            Set up your family
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
