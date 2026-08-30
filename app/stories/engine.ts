// Client runtime for Interactive Bible Stories: local persistence for
// instant resume (mirrors app/adventure/storage.ts), plus the completion
// flow that awards rewards through the app's existing systems.
//
// Local storage is the persistence that ALWAYS works, exactly like the rest
// of Adventure World/Arcade/Character today. A signed-in child (real
// Supabase-backed session, see app/lib/child-session.ts) additionally gets
// server-verified resume + idempotent completion via /api/stories/progress
// and /api/stories/complete — but a child without a real session (the
// app's existing "demo family" local-only mode) still gets a fully working,
// locally-idempotent story experience, matching how Adventure World's own
// chapter/boss/secret rewards already work with no server round trip.

import { markCollectibleCollected, markChapterCompletedSilently } from '../adventure/storage';
import { awardCoins, awardGems, awardXP } from '../lib/economy/wallet-service';
import type { AwardResult } from '../lib/economy/types';
import { logGameEvent } from '../lib/analytics';
import { startStory, type StoryProgressState } from './progression';
import type { InteractiveStory } from './types';

const PROGRESS_KEY = 'lanternLionStoryProgress';
const COMPLETED_KEY = 'lanternLionStoryCompleted';

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function storageKey(profileId: number, storyId: string): string {
  return `${profileId}:${storyId}`;
}

export function loadLocalStoryState(profileId: number, story: InteractiveStory): StoryProgressState {
  if (typeof window === 'undefined') return startStory(story);
  const all = safeParse<Record<string, StoryProgressState>>(localStorage.getItem(PROGRESS_KEY), {});
  return all[storageKey(profileId, story.id)] ?? startStory(story);
}

export function saveLocalStoryState(profileId: number, state: StoryProgressState): void {
  if (typeof window === 'undefined') return;
  const all = safeParse<Record<string, StoryProgressState>>(localStorage.getItem(PROGRESS_KEY), {});
  all[storageKey(profileId, state.storyId)] = state;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
}

function hasAwardedLocally(profileId: number, storyId: string): boolean {
  if (typeof window === 'undefined') return false;
  const all = safeParse<Record<string, boolean>>(localStorage.getItem(COMPLETED_KEY), {});
  return Boolean(all[storageKey(profileId, storyId)]);
}

function markAwardedLocally(profileId: number, storyId: string): void {
  if (typeof window === 'undefined') return;
  const all = safeParse<Record<string, boolean>>(localStorage.getItem(COMPLETED_KEY), {});
  all[storageKey(profileId, storyId)] = true;
  localStorage.setItem(COMPLETED_KEY, JSON.stringify(all));
}

export async function syncProgress(state: StoryProgressState): Promise<void> {
  try {
    await fetch('/api/stories/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storyId: state.storyId,
        currentSceneId: state.currentSceneId,
        choices: state.choices,
        answers: state.answers,
        hintsUsed: state.hintsUsed,
      }),
    });
  } catch {
    // No session / offline — local storage already has the resume state.
  }
}

export type ServerResumeState = {
  currentSceneId: string;
  choices: StoryProgressState['choices'];
  answers: StoryProgressState['answers'];
  hintsUsed: number;
  status: 'in_progress' | 'completed';
} | null;

/** Best-effort: returns null when there's no real child session (offline/demo mode). */
export async function fetchServerProgress(storyId: string): Promise<ServerResumeState> {
  try {
    const res = await fetch(`/api/stories/progress?storyId=${encodeURIComponent(storyId)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { progress?: ServerResumeState };
    return data?.progress ?? null;
  } catch {
    return null;
  }
}

export type CompletionOutcome = {
  firstCompletion: boolean;
  reward: { xp: number; coins: number; gems: number };
  awards: AwardResult[];
};

/**
 * Call once the child reaches and satisfies the story's FINAL_CHALLENGE.
 * Tries server-verified completion first (idempotent, cross-device); falls
 * back to a local idempotency check when no server session is available.
 * Only awards XP/coins/gems, the linked collectible, and fires the
 * GAME_COMPLETED analytics event on an actual first completion.
 */
export async function completeStory(
  profileId: number,
  story: InteractiveStory,
  state: StoryProgressState
): Promise<CompletionOutcome> {
  let firstCompletion = false;
  const awards: AwardResult[] = [];

  try {
    const res = await fetch('/api/stories/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storyId: story.id }),
    });
    if (res.status === 200) {
      firstCompletion = true;
    } else if (res.status === 409) {
      firstCompletion = false;
    } else {
      // No session / validation failed for a reason unrelated to a real
      // duplicate (e.g. offline) — fall back to local idempotency below.
      firstCompletion = !hasAwardedLocally(profileId, story.id);
    }
  } catch {
    firstCompletion = !hasAwardedLocally(profileId, story.id);
  }

  if (firstCompletion) {
    markAwardedLocally(profileId, story.id);
    awards.push(awardXP(profileId, story.reward.xp, 'story-completion', `Completed ${story.title}`));
    if (story.reward.coins > 0) awards.push(awardCoins(profileId, story.reward.coins, 'story-completion', `Completed ${story.title}`));
    if (story.reward.gems > 0) awards.push(awardGems(profileId, story.reward.gems, 'story-completion', `Completed ${story.title}`));

    markChapterCompletedSilently(profileId, story.adventure.chapterId);
    if (story.adventure.collectibleId) {
      markCollectibleCollected(profileId, story.adventure.collectibleId);
    }

    const accuracy = state.answers.length
      ? Math.round((state.answers.filter((a) => a.correct).length / state.answers.length) * 100)
      : 100;

    logGameEvent('GAME_COMPLETED', {
      userId: profileId,
      gameId: story.conceptId,
      activityId: story.id,
      category: 'interactive-story',
      accuracy,
      hintsUsed: state.hintsUsed,
      xpEarned: story.reward.xp,
    });
  }

  return { firstCompletion, reward: story.reward, awards };
}

/** Lightweight summary for a dashboard "Continue your story" banner — no server round trip. */
export function getStoryDashboardSummary(profileId: number, stories: InteractiveStory[]): { story: InteractiveStory; resuming: boolean } | null {
  if (typeof window === 'undefined') return null;
  const all = safeParse<Record<string, StoryProgressState>>(localStorage.getItem(PROGRESS_KEY), {});

  for (const story of stories) {
    const state = all[storageKey(profileId, story.id)];
    if (state && state.status === 'in_progress') {
      return { story, resuming: true };
    }
  }

  const nextUnstarted = stories.find((story) => !hasAwardedLocally(profileId, story.id));
  return nextUnstarted ? { story: nextUnstarted, resuming: false } : null;
}

export function startStorySession(profileId: number, story: InteractiveStory): void {
  logGameEvent('GAME_STARTED', {
    userId: profileId,
    gameId: story.conceptId,
    activityId: story.id,
    category: 'interactive-story',
  });
}
