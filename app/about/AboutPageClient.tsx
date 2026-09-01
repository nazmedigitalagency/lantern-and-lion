'use client';

import Link from 'next/link';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';

export default function AboutPage() {
  return (
    <main className="public-subpage">
      <SiteHeader activeNav="about" />

      {/* ── HERO BANNER ─────────────────────────────────── */}
      <section className="page-hero">
        <div className="page-hero-shell">
          <p className="eyebrow"><span aria-hidden="true">●</span> Our Vision &amp; Calling</p>
          <h1>Forming children in God’s Word<br className="hide-mobile" /> with joy and courage.</h1>
          <p className="page-hero-lead">
            We believe children don’t need more mindless digital noise. They deserve a thoughtful, playful, and spiritually rich space that helps them love Scripture and live it with courage.
          </p>
        </div>
      </section>

      {/* ── THE LANTERN & THE LION ──────────────────────── */}
      <section className="mission-story-section">
        <div className="mission-dual-grid">
          <article className="dual-card gold">
            <div className="dual-icon">🏮</div>
            <h2>The Lantern</h2>
            <p className="verse-quote">“Your word is a lamp to my feet, and a light for my path.” — Psalm 119:105</p>
            <p>
              The lantern represents guidance and wisdom. In a loud and confusing world, Scripture gives children clarity for the very next step in front of them: how to treat a classmate, speak with kindness, and forgive.
            </p>
          </article>

          <article className="dual-card navy">
            <div className="dual-icon">🦁</div>
            <h2>The Lion</h2>
            <p className="verse-quote">“The righteous are as bold as a lion.” — Proverbs 28:1</p>
            <p>
              The lion represents faithful courage. Knowing God’s truth isn’t just head knowledge—it gives young believers the holy confidence to stand up for the hurting, remain loyal, and live unashamed for Christ.
            </p>
          </article>
        </div>
      </section>

      {/* ── STATEMENT OF FAITH ──────────────────────────── */}
      <section className="faith-statement-section">
        <div className="faith-statement-shell">
          <div className="section-heading">
            <p className="kicker">Core Convictions</p>
            <h2>Our Statement of Faith</h2>
          </div>

          <div className="faith-pillars-grid">
            <article className="faith-pillar">
              <span className="faith-num">1</span>
              <h3>The Authority of Scripture</h3>
              <p>We hold the Holy Bible to be the inspired, trustworthy, and authoritative Word of God, fully sufficient to guide every child in faith and life.</p>
            </article>

            <article className="faith-pillar">
              <span className="faith-num">2</span>
              <h3>The Good News of Jesus Christ</h3>
              <p>Everything in Scripture centers on the grace, sacrificial love, and victorious resurrection of Jesus Christ our Lord.</p>
            </article>

            <article className="faith-pillar">
              <span className="faith-num">3</span>
              <h3>Faith in Real Life</h3>
              <p>We do not merely teach facts and trivia; we train hearts for godly character, prayer, discernment, kindness, and spiritual resilience.</p>
            </article>

            <article className="faith-pillar">
              <span className="faith-num">4</span>
              <h3>The Centrality of Family &amp; Church</h3>
              <p>Technology is a humble tool. Parents and the local church are God’s primary instruments for discipling the next generation.</p>
            </article>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────── */}
      <section className="join-section">
        <div>
          <p className="kicker">Join Our Growing Community</p>
          <h2>Walk with us in raising bold young lights.</h2>
          <p>Create a family account today and begin the journey together.</p>
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
      <SiteFooter />
    </main>
  );
}
