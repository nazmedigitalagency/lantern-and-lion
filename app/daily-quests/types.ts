// Daily Quests data model.
//
// A quest TEMPLATE is content (title, category, reward, how it gets
// fulfilled). A quest INSTANCE is one template placed into one day's
// set, with its own completion state. Keeping those separate is what
// lets the daily pool grow (more templates, more variety) without the
// day-to-day generation/completion logic ever changing.

export type DailyQuestCategory =
  | 'bible-reading'
  | 'bible-story'
  | 'memory-verse'
  | 'minigame'
  | 'adventure-quest'
  | 'quiz'
  | 'exploration'
  | 'skill-challenge';

/**
 * HOW a quest gets marked complete. The category is content framing
 * ("what kind of quest is this to a child"); the completion mode is
 * the plumbing behind it. Several categories can share a mode.
 *
 * `adventure-progress` / `lesson-progress` / `region-discovery` are
 * auto-detected by comparing today's Adventure World / Character
 * stats against a snapshot taken at the start of the day (see
 * `progression.ts`) — no separate mini-game needed, and nothing about
 * Adventure World has to change to support this.
 *
 * `verse-recall` / `word-scramble` are small, self-contained
 * interactions that live only inside the Daily Quests page.
 *
 * `arcade-session` is auto-detected the same way as the Adventure
 * World modes: a snapshot of arcade sessions played today, compared
 * against live data from `arcade/storage` (see `progression.ts`).
 */
export type CompletionMode = 'adventure-progress' | 'lesson-progress' | 'region-discovery' | 'verse-recall' | 'word-scramble' | 'arcade-session';

export type DailyQuestTemplate = {
  id: string;
  category: DailyQuestCategory;
  title: string;
  description: string;
  icon: string;
  xp: number;
  coins: number;
  completionMode: CompletionMode;
  difficulty: 1 | 2 | 3 | 4 | 5;
};

/** The four category "slots" every day's set is built from, in display order. */
export type DailyQuestSlot = DailyQuestCategory;

export type DailyQuestInstance = {
  templateId: string;
  completed: boolean;
  completedAt: string | null;
};

/** A snapshot of progress counters taken the moment a day's set is generated — the baseline auto-detection compares against. */
export type DaySnapshot = {
  questsCompleted: number;
  lessonSteps: number;
  regionsDiscovered: number;
  /** Arcade sessions played today at the moment this snapshot was taken. */
  arcadeSessionsToday: number;
};

export type DailyQuestSet = {
  /** Local YYYY-MM-DD this set belongs to. */
  date: string;
  quests: DailyQuestInstance[];
  snapshot: DaySnapshot;
  bonusClaimed: boolean;
  chestOpened: boolean;
};

export type HistoryEntry = { date: string; completed: boolean };

export type StreakInfo = {
  current: number;
  longest: number;
  daysCompleted: number;
};

export type ChestReward = {
  coins: number;
  xp: number;
  gems: number;
};
