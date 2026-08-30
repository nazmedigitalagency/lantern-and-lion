// Lantern Arcade — shared game engine data model.
//
// Every game (built now or later) produces the same GameResult shape
// and gets scored/rewarded/persisted through the same functions in
// `progression.ts` / `storage.ts`. A new game means adding a
// GameDefinition + a route that renders its own play loop and ends by
// calling `recordGameSession` — nothing about the engine changes.

export type GameId =
  | 'scripture-maze'
  | 'scripture-scramble'
  | 'verse-builder'
  | 'lightning-quiz'
  | 'memory-match'
  | 'build-the-story'
  | 'bible-detective'
  | 'scripture-connections';

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';
export const DIFFICULTY_ORDER: DifficultyLevel[] = ['easy', 'medium', 'hard', 'expert'];

export type AgeBand = 'kids' | 'tweens' | 'teens';

export type GameSkill =
  | 'bible-knowledge'
  | 'reading'
  | 'vocabulary'
  | 'memory'
  | 'attention'
  | 'pattern-recognition'
  | 'sequencing'
  | 'problem-solving'
  | 'critical-thinking';

export type GameDefinition = {
  id: GameId;
  name: string;
  icon: string;
  description: string;
  skills: GameSkill[];
  /** Whether this game has a real route today. Unimplemented games still show on the Arcade home as "coming soon". */
  implemented: boolean;
  /** XP a solid (100% accuracy, easy difficulty) run is worth — see `computeGameReward` for how difficulty/accuracy scale it. */
  baseXp: number;
};

/** What every game reports when a session ends — the one shape the reward engine and result screen understand. */
export type GameResult = {
  gameId: GameId;
  score: number;
  /** 0-100. */
  accuracy: number;
  timeSeconds: number;
  difficulty: DifficultyLevel;
  mistakes: number;
  completed: boolean;
  /** Optional — only combo-based games (e.g. Lightning Quiz) report these. */
  highestCombo?: number;
  avgResponseMs?: number;
  /** Optional — only sequencing games (e.g. Build the Story) report these. */
  attempts?: number;
  hintsUsed?: number;
};

export type PersonalBest = {
  score: number;
  accuracy: number;
  timeSeconds: number;
  difficulty: DifficultyLevel;
  achievedAt: string;
  /** Optional — older stored bests predate these fields. */
  mistakes?: number;
  highestCombo?: number;
  avgResponseMs?: number;
  attempts?: number;
  hintsUsed?: number;
};

export type GameSessionRecord = {
  gameId: GameId;
  date: string;
  score: number;
  accuracy: number;
  timeSeconds: number;
  difficulty: DifficultyLevel;
  xpEarned: number;
  coinsEarned: number;
  mistakes: number;
  highestCombo?: number;
  avgResponseMs?: number;
  attempts?: number;
  hintsUsed?: number;
};

export type GameOutcome = {
  session: GameSessionRecord;
  isNewBest: boolean;
  previousBest: PersonalBest | null;
};
