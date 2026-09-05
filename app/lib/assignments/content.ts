import { getStory, STORY_CATALOG } from '../../stories/catalog';
import { curriculumModules } from '../../curriculum-data';
import { getGameDefinition } from '../../arcade/catalog';
import type { AssignmentType } from './types';

/**
 * Only arcade games that actually report GAME_COMPLETED to the server
 * (logGameEvent → POST /api/analytics/track) can be auto-scored — the other
 * four games are real, playable features but track results in localStorage
 * only, so there is no server-side signal to assign/grade against. Assigning
 * one of those today has to go through "Custom Assignment" instead (the
 * teacher writes the instructions, the student self-marks done).
 */
export const ASSIGNABLE_GAME_IDS = ['lightning-quiz', 'build-the-story', 'memory-match', 'scripture-connections'] as const;

export function assignableGames(): { id: string; label: string }[] {
  return ASSIGNABLE_GAME_IDS.map((id) => {
    const def = getGameDefinition(id);
    return { id, label: def?.name || id };
  });
}

export function assignableStories(): { id: string; label: string }[] {
  return STORY_CATALOG.map((s) => ({ id: s.id, label: s.title }));
}

export function assignableConcepts(): { id: string; label: string }[] {
  return curriculumModules.map((m) => ({ id: m.id, label: m.title }));
}

function resolveModuleId(refId: string): string | null {
  if (curriculumModules.some((m) => m.id === refId)) return refId;
  const prefixes = ['path-', 'teen-', 'early-'];
  for (const p of prefixes) {
    const candidate = `${p}${refId}`;
    if (curriculumModules.some((m) => m.id === candidate)) return candidate;
  }
  return null;
}

/** Resolves a display label for whatever `reference_id` an assignment points at. */
export function referenceLabel(type: AssignmentType, referenceId: string | null): string | null {
  if (!referenceId) return null;
  switch (type) {
    case 'story': {
      const story = getStory(referenceId);
      if (story) return story.title;
      const modId = resolveModuleId(referenceId);
      if (modId) return curriculumModules.find((m) => m.id === modId)?.title || referenceId;
      return referenceId;
    }
    case 'reading':
    case 'quiz':
    case 'memory': {
      const modId = resolveModuleId(referenceId);
      return (modId ? curriculumModules.find((m) => m.id === modId)?.title : null) || referenceId;
    }
    case 'game': return getGameDefinition(referenceId as never)?.name || referenceId;
    default: return null;
  }
}

/** Where a student goes to actually do the assigned content. */
export function contentLink(type: AssignmentType, referenceId: string | null): string | null {
  if (!referenceId) {
    if (type === 'quiz') return '/arcade/lightning-quiz';
    if (type === 'memory') return '/arcade/verse-builder';
    return null;
  }
  switch (type) {
    case 'story': {
      if (getStory(referenceId)) return `/stories/${referenceId}`;
      const modId = resolveModuleId(referenceId);
      if (modId) return `/curriculum/${modId}`;
      return `/stories`;
    }
    case 'reading': {
      const modId = resolveModuleId(referenceId);
      return modId ? `/curriculum/${modId}` : '/curriculum';
    }
    case 'quiz': {
      const modId = resolveModuleId(referenceId);
      if (modId) return `/curriculum/${modId}`;
      return '/arcade/lightning-quiz';
    }
    case 'memory': {
      const modId = resolveModuleId(referenceId);
      if (modId) return `/curriculum/${modId}`;
      return '/arcade/verse-builder';
    }
    case 'game': {
      if (getGameDefinition(referenceId as never)) return `/arcade/${referenceId}`;
      return `/arcade`;
    }
    default: return null;
  }
}

export function referenceExists(type: AssignmentType, referenceId: string): boolean {
  switch (type) {
    case 'story': return Boolean(getStory(referenceId));
    case 'reading':
    case 'quiz':
    case 'memory': return curriculumModules.some((m) => m.id === referenceId);
    case 'game': return (ASSIGNABLE_GAME_IDS as readonly string[]).includes(referenceId);
    default: return false;
  }
}
