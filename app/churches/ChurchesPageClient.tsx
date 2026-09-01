'use client';

import Link from 'next/link';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';

export default function ChurchesPage() {
  return (
    <main className="public-subpage">
      <SiteHeader activeNav="churches" />

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
      <SiteFooter />
    </main>
  );
}
