import type { DailyQuestCategory, DailyQuestTemplate } from './types';

// ── QUEST TEMPLATE POOLS ─────────────────────────────────────────
// Every day's set is built by picking one template per slot category
// below. More than one template per category is what creates real
// day-to-day variety instead of showing the same four quests forever.
export const QUEST_TEMPLATES: DailyQuestTemplate[] = [
  // bible-reading — satisfied by any lesson progress made today (auto-detected)
  { id: 'read-a-story', category: 'bible-reading', title: 'Read a Story', description: 'Make progress in one Bible story today.', icon: '📖', xp: 50, coins: 5, completionMode: 'lesson-progress', difficulty: 1 },
  { id: 'keep-reading', category: 'bible-reading', title: 'Keep Reading', description: 'Continue any story you’ve started.', icon: '📗', xp: 50, coins: 5, completionMode: 'lesson-progress', difficulty: 1 },
  { id: 'story-time', category: 'bible-story', title: 'Story Time', description: 'Finish a step of today’s Bible story.', icon: '📜', xp: 55, coins: 5, completionMode: 'lesson-progress', difficulty: 1 },

  // memory-verse — a small in-page recall widget
  { id: 'memory-challenge', category: 'memory-verse', title: 'Memory Challenge', description: 'Complete today’s verse recall.', icon: '🧠', xp: 75, coins: 8, completionMode: 'verse-recall', difficulty: 2 },
  { id: 'verse-keeper', category: 'memory-verse', title: 'Verse Keeper', description: 'Recall today’s verse from memory.', icon: '💭', xp: 75, coins: 8, completionMode: 'verse-recall', difficulty: 2 },

  // quiz / minigame / skill-challenge — a small in-page word puzzle, or a trip to the Lantern Arcade
  { id: 'daily-puzzle', category: 'quiz', title: 'Daily Puzzle', description: 'Unscramble today’s Bible word.', icon: '🧩', xp: 50, coins: 5, completionMode: 'word-scramble', difficulty: 2 },
  { id: 'arcade-challenge', category: 'quiz', title: 'Arcade Challenge', description: 'Play today’s featured Lantern Arcade game.', icon: '🕹️', xp: 60, coins: 6, completionMode: 'arcade-session', difficulty: 2 },
  { id: 'word-challenge', category: 'skill-challenge', title: 'Word Challenge', description: 'Untangle a tricky Bible word.', icon: '🎯', xp: 55, coins: 6, completionMode: 'word-scramble', difficulty: 3 },
  { id: 'quick-match', category: 'minigame', title: 'Quick Match', description: 'Solve today’s letter puzzle.', icon: '🔤', xp: 50, coins: 5, completionMode: 'word-scramble', difficulty: 2 },

  // adventure-quest — satisfied by finishing any Adventure World quest today (auto-detected)
  { id: 'adventure-quest', category: 'adventure-quest', title: 'Adventure', description: 'Complete one Adventure World quest today.', icon: '🗺️', xp: 100, coins: 15, completionMode: 'adventure-progress', difficulty: 3 },
  { id: 'quest-onward', category: 'adventure-quest', title: 'Onward!', description: 'Finish a quest anywhere in the world.', icon: '🧭', xp: 100, coins: 15, completionMode: 'adventure-progress', difficulty: 3 },

  // exploration — satisfied by unlocking a new region today (auto-detected)
  { id: 'new-horizons', category: 'exploration', title: 'New Horizons', description: 'Discover a new region on the map.', icon: '🧭', xp: 80, coins: 10, completionMode: 'region-discovery', difficulty: 3 },
];

/** The fixed daily shape: one quest from each of these categories, in this display order. */
export const DAILY_SLOT_CATEGORIES: DailyQuestCategory[] = ['bible-reading', 'memory-verse', 'quiz', 'adventure-quest'];

export const BONUS_XP = 150;

export function getTemplatesForCategory(category: DailyQuestCategory): DailyQuestTemplate[] {
  return QUEST_TEMPLATES.filter((t) => t.category === category);
}

export function getTemplate(templateId: string): DailyQuestTemplate | undefined {
  return QUEST_TEMPLATES.find((t) => t.id === templateId);
}

// ── DETERMINISTIC "RANDOM" PICKING ───────────────────────────────
// Seeded by profile + date (+ an index for multiple picks), so the
// same player sees the same rotation all day, a different one
// tomorrow, and two players never collide — without a server.
function seededIndex(seed: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return length > 0 ? hash % length : 0;
}

export function pickTemplateForSlot(category: DailyQuestCategory, profileId: number | string, dateKey: string): DailyQuestTemplate {
  const pool = getTemplatesForCategory(category);
  const index = seededIndex(`${profileId}-${dateKey}-${category}`, pool.length);
  return pool[index];
}

// ── MEMORY VERSE + WORD SCRAMBLE CONTENT ─────────────────────────
// Small, self-contained content for the two in-page mini-interactions
// — not the Arcade (Scripture Maze / Scramble / Verse Builder are
// separate, larger features still to be built).
export const DAILY_VERSES: { reference: string; text: string }[] = [
  { reference: 'Psalm 119:105', text: 'Your word is a lamp to my feet, and a light for my path.' },
  { reference: 'Joshua 1:9', text: 'Be strong and courageous. Do not be frightened, for the Lord your God is with you.' },
  { reference: 'Proverbs 3:5', text: 'Trust in the Lord with all your heart, and do not lean on your own understanding.' },
  { reference: 'Philippians 4:13', text: 'I can do all things through Christ who strengthens me.' },
  { reference: 'Psalm 23:1', text: 'The Lord is my shepherd; I shall not want.' },
  { reference: 'Matthew 5:16', text: 'Let your light shine before others, so that they may see your good works.' },
  { reference: '1 John 4:19', text: 'We love because he first loved us.' },
];

export const DAILY_SCRAMBLE_WORDS: string[] = ['SHEPHERD', 'JERICHO', 'DISCIPLE', 'KINGDOM', 'PARABLE', 'COURAGE', 'BLESSING', 'COVENANT'];

export function getDailyVerse(dateKey: string): { reference: string; text: string } {
  return DAILY_VERSES[seededIndex(`verse-${dateKey}`, DAILY_VERSES.length)];
}

export function getDailyScrambleWord(dateKey: string): string {
  return DAILY_SCRAMBLE_WORDS[seededIndex(`scramble-${dateKey}`, DAILY_SCRAMBLE_WORDS.length)];
}
