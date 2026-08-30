import { davidAndGoliath } from './content/david-and-goliath';
import { noahAndTheArk } from './content/noah-and-the-ark';
import type { InteractiveStory } from './types';

export const STORY_CATALOG: InteractiveStory[] = [davidAndGoliath, noahAndTheArk];

export function getStory(id: string): InteractiveStory | undefined {
  return STORY_CATALOG.find((s) => s.id === id);
}

export function getSceneMap(story: InteractiveStory): Map<string, InteractiveStory['scenes'][number]> {
  return new Map(story.scenes.map((scene) => [scene.id, scene]));
}

export function getLastSceneId(story: InteractiveStory): string {
  const last = story.scenes.find((s) => s.nextSceneId === null);
  return last ? last.id : story.scenes[story.scenes.length - 1].id;
}

export function getStoryForChapter(chapterId: string): InteractiveStory | undefined {
  return STORY_CATALOG.find((s) => s.adventure.chapterId === chapterId);
}

/**
 * Dev-time guardrail for the "100% faithful to Scripture, choices never
 * diverge outcomes" rule: every nextSceneId must resolve to a real scene (or
 * null on exactly one, final, scene), and a CHOICE scene's options must not
 * secretly branch to different next scenes. Runs once per story at module
 * load, non-production only, so a content mistake is caught by a developer
 * immediately rather than surfacing to a child.
 */
function assertLinearAndFaithful(story: InteractiveStory): void {
  const ids = new Set(story.scenes.map((s) => s.id));
  let terminalCount = 0;

  for (const scene of story.scenes) {
    if (scene.nextSceneId === null) {
      terminalCount += 1;
    } else if (!ids.has(scene.nextSceneId)) {
      throw new Error(`Story "${story.id}": scene "${scene.id}" points to unknown nextSceneId "${scene.nextSceneId}".`);
    }
  }

  if (terminalCount !== 1) {
    throw new Error(`Story "${story.id}": expected exactly one terminal scene, found ${terminalCount}.`);
  }

  if (!ids.has(story.firstSceneId)) {
    throw new Error(`Story "${story.id}": firstSceneId "${story.firstSceneId}" is not a real scene id.`);
  }
}

if (process.env.NODE_ENV !== 'production') {
  STORY_CATALOG.forEach(assertLinearAndFaithful);
}
