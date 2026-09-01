import { DIFFICULTY_ORDER, type DifficultyLevel, type GameDefinition, type GameId } from './types';

// ── GAME CATALOG ─────────────────────────────────────────────────
// The 5 unbuilt games are real catalog entries (name/icon/skills) so
// the Arcade home is honest about what's coming, without a working
// route yet. Adding one later is: flip `implemented`, add a route.
export const GAME_DEFINITIONS: GameDefinition[] = [
  { id: 'scripture-maze', name: 'Scripture Maze', icon: '🌀', description: 'Navigate a maze, collect Scripture fragments, and answer checkpoint questions to press on.', skills: ['problem-solving', 'attention', 'bible-knowledge'], implemented: true, baseXp: 80 },
  { id: 'scripture-scramble', name: 'Scripture Scramble', icon: '🔤', description: 'Unscramble Bible names and words before the round ends.', skills: ['vocabulary', 'reading', 'pattern-recognition'], implemented: true, baseXp: 60 },
  { id: 'verse-builder', name: 'Verse Builder', icon: '🧱', description: 'Arrange a scrambled verse back into the correct order.', skills: ['sequencing', 'memory', 'reading'], implemented: true, baseXp: 70 },
  { id: 'lightning-quiz', name: 'Lightning Quiz', icon: '⚡', description: 'Fast true-or-false and multiple choice Bible questions against the clock.', skills: ['bible-knowledge', 'critical-thinking'], implemented: true, baseXp: 60 },
  { id: 'memory-match', name: 'Memory Match', icon: '🃏', description: 'Flip cards to match Bible people, places and stories.', skills: ['memory', 'attention', 'bible-knowledge'], implemented: true, baseXp: 60 },
  { id: 'build-the-story', name: 'Build the Story', icon: '📖', description: 'Put story events back into the order they happened.', skills: ['sequencing', 'critical-thinking', 'memory', 'reading'], implemented: true, baseXp: 70 },
  { id: 'bible-detective', name: 'Bible Detective', icon: '🔍', description: 'Follow the clues to work out who or what is being described.', skills: ['critical-thinking', 'reading', 'memory', 'attention', 'bible-knowledge'], implemented: true, baseXp: 80 },
  { id: 'scripture-connections', name: 'Scripture Connections', icon: '🔗', description: 'Group words and names into the categories they belong to.', skills: ['pattern-recognition', 'critical-thinking', 'vocabulary', 'memory', 'bible-knowledge'], implemented: true, baseXp: 70 },
];

export function getGameDefinition(id: GameId): GameDefinition | undefined {
  return GAME_DEFINITIONS.find((g) => g.id === id);
}

export function getImplementedGames(): GameDefinition[] {
  return GAME_DEFINITIONS.filter((g) => g.implemented);
}

// ── AGE ADAPTATION ───────────────────────────────────────────────
/** Sensible default difficulty by age — a starting point, not a ceiling; every game lets the player pick their own. */
export function defaultDifficultyForAge(age: number): DifficultyLevel {
  if (age <= 8) return 'easy';
  if (age <= 11) return 'medium';
  if (age <= 14) return 'hard';
  return 'expert';
}

/**
 * Same as defaultDifficultyForAge, but floors teen accounts at 'hard' —
 * a teen never lands on 'easy'/'medium' even if age data is missing or wrong.
 */
export function defaultDifficultyFor(profile: { kind: 'child' | 'teen'; age: number }): DifficultyLevel {
  const base = defaultDifficultyForAge(profile.age);
  if (profile.kind === 'teen' && (base === 'easy' || base === 'medium')) return 'hard';
  return base;
}

/** Difficulty levels a player is allowed to pick — teens can't drop to easy/medium. */
export function allowedDifficultiesFor(kind: 'child' | 'teen'): DifficultyLevel[] {
  return kind === 'teen' ? DIFFICULTY_ORDER.filter((level) => level === 'hard' || level === 'expert') : DIFFICULTY_ORDER;
}

export const DIFFICULTY_LABEL: Record<DifficultyLevel, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard', expert: 'Expert' };

/**
 * Adaptive difficulty foundation: given recent session accuracy at the
 * player's current difficulty, suggest whether to hold, step up, or
 * step down. Not wired into any game's auto-behavior yet — games
 * expose a manual difficulty picker today; a future version can call
 * this after each session to suggest (not force) a change.
 */
export function suggestNextDifficulty(current: DifficultyLevel, recentAccuracies: number[]): DifficultyLevel {
  if (recentAccuracies.length < 3) return current;
  const avg = recentAccuracies.reduce((a, b) => a + b, 0) / recentAccuracies.length;
  const index = DIFFICULTY_ORDER.indexOf(current);
  if (avg >= 92 && index < DIFFICULTY_ORDER.length - 1) return DIFFICULTY_ORDER[index + 1];
  if (avg <= 45 && index > 0) return DIFFICULTY_ORDER[index - 1];
  return current;
}

// ── SCRIPTURE SCRAMBLE WORD POOLS ────────────────────────────────
export const SCRAMBLE_WORD_POOLS: Record<DifficultyLevel, string[]> = {
  easy: ['NOAH', 'DAVID', 'MOSES', 'MARY', 'PETER', 'JOHN', 'ADAM', 'EVE'],
  medium: ['JERICHO', 'SAMUEL', 'ESTHER', 'DANIEL', 'GOLIATH', 'SHEPHERD', 'DISCIPLE'],
  hard: ['NEBUCHADNEZZAR', 'RESURRECTION', 'TABERNACLE', 'PHILISTINES', 'JERUSALEM'],
  expert: ['TRANSFIGURATION', 'RIGHTEOUSNESS', 'MELCHIZEDEK', 'RECONCILIATION', 'SANCTIFICATION', 'PROPITIATION', 'JUSTIFICATION', 'OMNISCIENCE', 'ESCHATOLOGY', 'INCARNATION'],
};

export const SCRAMBLE_ROUNDS_PER_SESSION = 5;

// ── VERSE BUILDER VERSE POOLS ────────────────────────────────────
export const VERSE_POOLS: Record<DifficultyLevel, { reference: string; text: string }[]> = {
  easy: [
    { reference: 'Psalm 23:1', text: 'The Lord is my shepherd.' },
    { reference: 'John 11:35', text: 'Jesus wept.' },
    { reference: '1 John 4:8', text: 'God is love.' },
  ],
  medium: [
    { reference: 'Philippians 4:13', text: 'I can do all things through Christ who strengthens me.' },
    { reference: 'Joshua 1:9', text: 'Be strong and courageous, for the Lord your God is with you.' },
    { reference: 'Proverbs 3:5', text: 'Trust in the Lord with all your heart.' },
  ],
  hard: [
    { reference: 'Romans 8:28', text: 'We know that all things work together for good to those who love God.' },
    { reference: 'Psalm 119:105', text: 'Your word is a lamp to my feet, and a light for my path.' },
    { reference: 'Matthew 5:16', text: 'Let your light shine before others, so that they may see your good works.' },
  ],
  expert: [
    { reference: 'Ephesians 2:8-9', text: 'For by grace you have been saved through faith, and that not of yourselves, it is the gift of God, not of works, so that no one may boast.' },
    { reference: 'Romans 12:2', text: 'Do not be conformed to this world, but be transformed by the renewal of your mind, so you may discern what is the good and acceptable and perfect will of God.' },
    { reference: 'Hebrews 11:1', text: 'Now faith is the assurance of things hoped for, the conviction of things not seen.' },
    { reference: 'Romans 8:38-39', text: 'For I am sure that neither death nor life, nor angels nor rulers, nor things present nor things to come, nor powers, nor height nor depth, nor anything else in all creation, will be able to separate us from the love of God in Christ Jesus our Lord.' },
    { reference: '2 Corinthians 5:17', text: 'Therefore, if anyone is in Christ, he is a new creation. The old has passed away; behold, the new has come.' },
  ],
};

export const VERSE_ROUNDS_PER_SESSION = 3;
