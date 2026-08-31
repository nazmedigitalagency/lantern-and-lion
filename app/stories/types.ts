// Interactive Bible Story engine data model.
//
// A story is a linear chain of scenes (NARRATION/DIALOGUE/CHOICE/QUIZ/MEMORY/
// FINAL_CHALLENGE today — more kinds can be added later as new union members
// without touching the engine). Every scene has exactly one `nextSceneId` on
// the canonical, Scripture-faithful path; a CHOICE scene's options change
// feedback and optional bonus content, never which scene comes next. This is
// what keeps the interactive layer honest: the child's choices shape how
// they practice and what encouragement they receive, but never rewrite what
// actually happened in the biblical account.
//
// Both a child-mode and teen-mode copy live on every text field
// (`AgeVariantText`) rather than two parallel story graphs, so scene count,
// order, and progress/analytics never depend on which age mode was used.

import type { WorldKind } from '../adventure/world-data';

export type { WorldKind };

export type AgeVariantText = {
  child: string;
  teen: string;
};

/** Mirrors `MemoryVerseChallenge`'s reference/text/translation shape from Adventure World. */
export type ScriptureQuote = {
  reference: string;
  text: string;
  translation: string;
};

export type StoryCharacter = {
  id: string;
  name: string;
  emoji: string;
  role: 'protagonist' | 'antagonist' | 'narrator' | 'supporting';
  accentColor?: 'navy' | 'teal' | 'coral' | 'gold';
};

export type SceneIllustration = {
  emoji: string;
  background?: 'day' | 'night' | 'battlefield' | 'ark' | 'storm' | 'rainbow' | 'temple';
  imageUrl?: string;
  imageAlt?: string;
};

type BaseScene = {
  id: string;
  order: number;
  /** id of the next scene on the canonical path. Only the last scene has null. */
  nextSceneId: string | null;
  illustration?: SceneIllustration;
  scripture?: ScriptureQuote;
};

export type NarrationScene = BaseScene & {
  type: 'NARRATION';
  text: AgeVariantText;
};

export type DialogueScene = BaseScene & {
  type: 'DIALOGUE';
  speakerId: string;
  line: AgeVariantText;
};

export type StoryChoice = {
  id: string;
  label: AgeVariantText;
  /** Shown after the child picks this option. Never changes nextSceneId. */
  feedback: AgeVariantText;
  isBestChoice: boolean;
  bonusContent?: { emoji: string; text: AgeVariantText };
  imageUrl?: string;
};

export type ChoiceScene = BaseScene & {
  type: 'CHOICE';
  prompt: AgeVariantText;
  choices: StoryChoice[];
};

export type QuizQuestion = {
  id: string;
  prompt: AgeVariantText;
  options: AgeVariantText[];
  correctIndex: number;
  explanation: AgeVariantText;
};

export type QuizScene = BaseScene & {
  type: 'QUIZ';
  questions: QuizQuestion[];
};

export type MemoryScene = BaseScene & {
  type: 'MEMORY';
  verse: ScriptureQuote;
  blanks: string[];
  theme: string;
};

export type FinalChallengeScene = BaseScene & {
  type: 'FINAL_CHALLENGE';
  title: AgeVariantText;
  questions: QuizQuestion[];
  requiredScore: number;
};

export type StoryScene =
  | NarrationScene
  | DialogueScene
  | ChoiceScene
  | QuizScene
  | MemoryScene
  | FinalChallengeScene;

export type InteractiveStory = {
  id: string;
  title: string;
  heroEmoji: string;
  scriptureRange: string;
  estimatedMinutes: number;
  coverImageUrl?: string;
  thumbnailImageUrl?: string;
  characters: StoryCharacter[];
  scenes: StoryScene[];
  firstSceneId: string;
  /** curriculum-data.ts module id — feeds adaptive mastery via the existing concept pipeline. */
  conceptId: string;
  /** Links this story to a Bible Adventure World region/chapter (app/adventure/world-data.ts). */
  adventure: { regionId: string; chapterId: string; collectibleId?: string };
  /** Canonical, server-echoed reward amounts — never client-computed. */
  reward: { xp: number; coins: number; gems: number };
};
