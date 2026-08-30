// Pure story-progress state machine — no React, no fetch. Mirrors the style
// of app/adventure/progression.ts.

import { getLastSceneId, getSceneMap } from './catalog';
import type { InteractiveStory, StoryScene } from './types';

export type StoryChoiceRecord = { sceneId: string; choiceId: string };
export type StoryAnswerRecord = { sceneId: string; questionId: string; correct: boolean };

export type StoryProgressState = {
  storyId: string;
  currentSceneId: string;
  choices: StoryChoiceRecord[];
  answers: StoryAnswerRecord[];
  hintsUsed: number;
  status: 'in_progress' | 'completed';
};

export function startStory(story: InteractiveStory): StoryProgressState {
  return {
    storyId: story.id,
    currentSceneId: story.firstSceneId,
    choices: [],
    answers: [],
    hintsUsed: 0,
    status: 'in_progress',
  };
}

export function getCurrentScene(story: InteractiveStory, state: StoryProgressState): StoryScene {
  const map = getSceneMap(story);
  return map.get(state.currentSceneId) ?? map.get(story.firstSceneId)!;
}

export function advance(story: InteractiveStory, state: StoryProgressState): StoryProgressState {
  const scene = getCurrentScene(story, state);
  if (scene.nextSceneId === null) {
    return { ...state, status: 'completed' };
  }
  return { ...state, currentSceneId: scene.nextSceneId };
}

export function recordChoice(state: StoryProgressState, sceneId: string, choiceId: string): StoryProgressState {
  return { ...state, choices: [...state.choices.filter((c) => c.sceneId !== sceneId), { sceneId, choiceId }] };
}

export function recordAnswer(state: StoryProgressState, sceneId: string, questionId: string, correct: boolean): StoryProgressState {
  return {
    ...state,
    answers: [...state.answers.filter((a) => !(a.sceneId === sceneId && a.questionId === questionId)), { sceneId, questionId, correct }],
  };
}

export function recordHintUsed(state: StoryProgressState): StoryProgressState {
  return { ...state, hintsUsed: state.hintsUsed + 1 };
}

export function isAtFinalScene(story: InteractiveStory, state: StoryProgressState): boolean {
  return state.currentSceneId === getLastSceneId(story);
}

/** Correct answers within one scene, e.g. to check a FINAL_CHALLENGE's requiredScore. */
export function correctCountForScene(state: StoryProgressState, sceneId: string): number {
  return state.answers.filter((a) => a.sceneId === sceneId && a.correct).length;
}

export function computeQuizAccuracy(state: StoryProgressState): number {
  if (state.answers.length === 0) return 100;
  const correct = state.answers.filter((a) => a.correct).length;
  return Math.round((correct / state.answers.length) * 100);
}

export function conceptsPracticed(story: InteractiveStory): string[] {
  return [story.conceptId];
}
