// Standardized game session analytics — the first of its kind in this
// codebase, so every game (starting with Memory Match) can log through
// the same shape instead of each inventing its own. Local-storage
// backed today, same pattern as `arcade/storage.ts`; swapping in a real
// analytics backend later means changing `logGameEvent`'s body only —
// callers and the event shape don't change.

export type GameAnalyticsEventName =
  | 'GAME_STARTED'
  | 'QUESTION_ANSWERED'
  | 'GAME_COMPLETED'
  | 'PERSONAL_BEST'
  | 'HINT_USED'
  | 'STORY_MASTERED'
  | 'CLUE_VIEWED'
  | 'CASE_COMPLETED'
  | 'CASE_MASTERED'
  | 'GROUP_SOLVED'
  | 'MISTAKE_MADE';

export type GameAnalyticsPayload = {
  userId: number;
  gameId: string;
  difficulty: string;
  category?: string;
  story?: string;
  /** Bible Detective: the case id/title, and the clue id/type for CLUE_VIEWED. */
  caseId?: string;
  clue?: string;
  /** Scripture Connections: which puzzle, and 'daily' | 'practice'. */
  puzzleId?: string;
  mode?: string;
  score?: number;
  accuracy?: number;
  timeSeconds?: number;
  mistakes?: number;
  matches?: number;
  questionsAnswered?: number;
  questionsCorrect?: number;
  combo?: number;
  attempts?: number;
  hintsUsed?: number;
  xpEarned?: number;
  skillsPracticed?: string[];
};

export type GameAnalyticsEvent = GameAnalyticsPayload & {
  event: GameAnalyticsEventName;
  timestamp: string;
};

const EVENTS_KEY = 'lanternLionGameAnalytics';
const MAX_STORED_EVENTS = 200;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Records a GAME_STARTED / GAME_COMPLETED event for the Parent/Teacher dashboards to read via `getGameEvents`. */
export function logGameEvent(event: GameAnalyticsEventName, payload: GameAnalyticsPayload): void {
  if (typeof window === 'undefined') return;
  const entry: GameAnalyticsEvent = { ...payload, event, timestamp: new Date().toISOString() };
  const existing = safeParse<GameAnalyticsEvent[]>(localStorage.getItem(EVENTS_KEY), []);
  localStorage.setItem(EVENTS_KEY, JSON.stringify([entry, ...existing].slice(0, MAX_STORED_EVENTS)));

  // Send to server endpoint asynchronously for server-side rate-limited tracking
  try {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        gameId: payload.gameId,
        difficulty: payload.difficulty,
        category: payload.category,
        score: payload.score,
        timeSeconds: payload.timeSeconds,
        mistakes: payload.mistakes,
        xpEarned: payload.xpEarned,
      }),
    }).catch(() => {
      // Ignore network/offline failures for analytics
    });
  } catch {
    // Non-blocking
  }
}

/** All logged events, optionally filtered to one user — for Parent/Teacher analytics views. */
export function getGameEvents(userId?: number): GameAnalyticsEvent[] {
  if (typeof window === 'undefined') return [];
  const all = safeParse<GameAnalyticsEvent[]>(localStorage.getItem(EVENTS_KEY), []);
  return userId === undefined ? all : all.filter((e) => e.userId === userId);
}
