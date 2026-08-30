import { curriculumModules, type CurriculumModule } from '../../curriculum-data';

/**
 * A "concept" is one curriculum module (Noah's Ark, Ten Commandments, David &
 * Goliath, ...). The app already has 88 of these with ids, titles, Bible
 * references and an age track — that's a real content taxonomy, so the
 * adaptive engine is built directly on it instead of inventing a parallel
 * concept/tag system that would need its own content authoring.
 */
export type Concept = {
  id: string;
  label: string;
  bibleBooks: string;
  track: CurriculumModule['track'];
};

let conceptIndex: Map<string, Concept> | null = null;

function index(): Map<string, Concept> {
  if (!conceptIndex) {
    conceptIndex = new Map(curriculumModules.map((m) => [m.id, { id: m.id, label: m.title, bibleBooks: m.bibleBooks, track: m.track }]));
  }
  return conceptIndex;
}

export function getAllConcepts(): Concept[] {
  return Array.from(index().values());
}

export function getConcept(conceptId: string): Concept | undefined {
  return index().get(conceptId);
}

export function conceptsForTrack(track: CurriculumModule['track']): Concept[] {
  return getAllConcepts().filter((c) => c.track === track);
}

/**
 * Best-effort mapping from an analytics event's existing fields to a concept.
 * LESSON_COMPLETED events already tag `gameId` with the curriculum module id
 * (see app/learn/LearnPageClient.tsx), so that's a direct hit. Arcade GAME_
 * COMPLETED events only resolve when their `category`/`gameId` metadata
 * happens to match a module id or title keyword — most arcade sessions are
 * general skill practice, not tied to one Bible story, and simply don't
 * contribute to concept mastery, which is an intentional, honest scope limit
 * rather than force-fitting unrelated games onto the curriculum.
 */
export function resolveConceptId(gameId?: string | null, category?: string | null): string | null {
  if (gameId && index().has(gameId)) return gameId;

  const needle = (category || gameId || '').trim().toLowerCase();
  if (!needle) return null;

  for (const concept of index().values()) {
    if (concept.label.toLowerCase().includes(needle) || needle.includes(concept.id.toLowerCase())) {
      return concept.id;
    }
  }
  return null;
}
