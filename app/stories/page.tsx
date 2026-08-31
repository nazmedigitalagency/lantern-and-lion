import Image from 'next/image';
import Link from 'next/link';
import { STORY_CATALOG } from './catalog';

export default function StoryLibraryPage() {
  return (
    <main style={{ maxWidth: 840, margin: '0 auto', padding: '32px 16px 64px' }}>
      <p className="eyebrow"><span>📖</span>Interactive Bible Stories</p>
      <h1 style={{ margin: '0 0 6px', fontSize: 32, color: 'var(--navy)', fontWeight: 900 }}>Live the Story</h1>
      <p style={{ color: 'var(--muted)', fontWeight: 700, margin: '0 0 24px', fontSize: 16 }}>
        Real Bible accounts told as interactive adventures — explore chapters, make faith choices, learn memory verses, and master challenges true to Scripture.
      </p>

      <div className="story-library-grid">
        {STORY_CATALOG.map((story) => (
          <Link key={story.id} href={`/stories/${story.id}`} className="story-library-card">
            {story.coverImageUrl ? (
              <div className="story-card-cover-wrap">
                <Image
                  src={story.coverImageUrl}
                  alt={story.title}
                  width={640}
                  height={360}
                  className="story-card-cover-img"
                  loading="lazy"
                />
                <span className="story-card-badge" aria-hidden="true">
                  {story.heroEmoji}
                </span>
              </div>
            ) : (
              <span className="story-library-emoji" aria-hidden="true">{story.heroEmoji}</span>
            )}
            <div className="story-card-body">
              <h3>{story.title}</h3>
              <p className="story-card-ref">📖 {story.scriptureRange} · ⏱️ ~{story.estimatedMinutes} min</p>
              <div className="story-card-footer">
                <span className="story-reward-pill">⭐ +{story.reward.xp} XP</span>
                <span className="story-reward-pill">🪙 +{story.reward.coins}</span>
                <span className="story-card-cta">Play Story →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
