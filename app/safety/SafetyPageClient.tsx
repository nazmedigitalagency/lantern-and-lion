'use client';

import Link from 'next/link';
import { useState } from 'react';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';

export default function SafetyPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

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
      <SiteHeader activeNav="safety" />

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
      <SiteFooter />
    </main>
  );
}
