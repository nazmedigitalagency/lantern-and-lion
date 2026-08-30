import Link from 'next/link';
import { STORY_CATALOG } from './catalog';

export default function StoryLibraryPage() {
  return (
    <main style={{ maxWidth: 780, margin: '0 auto', padding: '32px 16px 64px' }}>
      <p className="eyebrow"><span>📖</span>Interactive Bible Stories</p>
      <h1 style={{ margin: '0 0 6px', fontSize: 28, color: 'var(--navy)' }}>Live the Story</h1>
      <p style={{ color: 'var(--muted)', fontWeight: 700, margin: '0 0 8px' }}>
        Real Bible accounts, told as an adventure — narration, choices, and a final challenge that stays true to Scripture.
      </p>

      <div className="story-library-grid">
        {STORY_CATALOG.map((story) => (
          <Link key={story.id} href={`/stories/${story.id}`} className="story-library-card">
            <span className="story-library-emoji" aria-hidden="true">{story.heroEmoji}</span>
            <h3>{story.title}</h3>
            <small>
              📖 {story.scriptureRange} · ⏱️ ~{story.estimatedMinutes} min
            </small>
          </Link>
        ))}
      </div>
    </main>
  );
}
