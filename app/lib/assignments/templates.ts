// Assignment Templates — reusable assignment *configuration*, never a copy
// of a student's response or any per-student data. Built-in templates are
// static catalog data (this file) so they ship with the product and never
// need a database row; a teacher's own templates live in the
// `assignment_templates` table and are surfaced alongside these.

import { curriculumModules } from '../../curriculum-data';
import { getStory } from '../../stories/catalog';
import type { AssignmentType } from './types';

export type TemplateCategory = 'scripture_memory' | 'bible_knowledge' | 'reading' | 'games' | 'stories' | 'reflection' | 'review';
export type TemplateAgeGroup = 'child' | 'teen' | 'both';
export type TemplateDifficulty = 'easy' | 'medium' | 'hard';

export const CATEGORY_LABEL: Record<TemplateCategory, string> = {
  scripture_memory: 'Scripture Memory',
  bible_knowledge: 'Bible Knowledge',
  reading: 'Reading',
  games: 'Games',
  stories: 'Stories',
  reflection: 'Reflection',
  review: 'Review',
};

export type AssignmentTemplate = {
  id: string;
  source: 'builtin' | 'mine';
  title: string;
  description: string;
  category: TemplateCategory;
  assignmentType: AssignmentType;
  referenceId: string | null;
  instructions: string | null;
  estimatedMinutes: number;
  ageGroup: TemplateAgeGroup;
  difficulty: TemplateDifficulty;
  timeLimitMinutes: number | null;
  requiredScore: number | null;
  xpReward: number | null;
};

/** Derives a template's age group from the real curriculum track behind its content — never guessed. */
function trackAgeGroup(conceptId: string): TemplateAgeGroup {
  const track = curriculumModules.find((m) => m.id === conceptId)?.track;
  if (track === 'teen') return 'teen';
  if (track === 'early' || track === 'pathfinder') return 'child';
  return 'both'; // 'family' track, or unresolved
}

function storyAgeGroup(storyId: string): TemplateAgeGroup {
  const story = getStory(storyId);
  return story ? trackAgeGroup(story.conceptId) : 'both';
}

type BuiltinDraft = Omit<AssignmentTemplate, 'id' | 'source' | 'ageGroup'> & { ageGroupOverride?: TemplateAgeGroup };

const DRAFTS: BuiltinDraft[] = [
  // ── Scripture Memory ──
  {
    title: 'Weekly Memory Verse',
    description: 'A short weekly verse for students to memorize and recall.',
    category: 'scripture_memory',
    assignmentType: 'memory',
    referenceId: 'early-shepherd',
    instructions: 'Practice this week’s verse a little each day, then come back and recite it from memory.',
    estimatedMinutes: 10,
    difficulty: 'easy',
    timeLimitMinutes: null,
    requiredScore: 70,
    xpReward: 30,
  },
  {
    title: 'Verse Recall Challenge',
    description: 'A tougher recall challenge for students who already know their verses well.',
    category: 'scripture_memory',
    assignmentType: 'memory',
    referenceId: 'path-ten-commandments-path',
    instructions: 'Recall as much of the passage as you can, in order.',
    estimatedMinutes: 15,
    difficulty: 'medium',
    timeLimitMinutes: 15,
    requiredScore: 80,
    xpReward: 40,
  },
  {
    title: 'Fill in the Missing Words',
    description: 'Practice a memory verse with a focus on the exact wording.',
    category: 'scripture_memory',
    assignmentType: 'memory',
    referenceId: 'early-lords-prayer',
    instructions: 'Fill in the missing words as you practice — accuracy matters here, not just the general idea.',
    estimatedMinutes: 10,
    difficulty: 'easy',
    timeLimitMinutes: null,
    requiredScore: 70,
    xpReward: 25,
  },

  // ── Bible Knowledge ──
  {
    title: 'Weekly Bible Quiz',
    description: 'A standard weekly quiz covering this week’s lesson.',
    category: 'bible_knowledge',
    assignmentType: 'quiz',
    referenceId: 'path-solomon',
    instructions: 'Take your time and answer each question carefully.',
    estimatedMinutes: 15,
    difficulty: 'medium',
    timeLimitMinutes: 20,
    requiredScore: 70,
    xpReward: 35,
  },
  {
    title: 'Bible Character Challenge',
    description: 'A quiz built around one Bible character’s story and choices.',
    category: 'bible_knowledge',
    assignmentType: 'quiz',
    referenceId: 'early-daniel',
    instructions: 'Think about what this person chose to do, and why.',
    estimatedMinutes: 15,
    difficulty: 'medium',
    timeLimitMinutes: null,
    requiredScore: 70,
    xpReward: 30,
  },
  {
    title: 'Bible Story Review',
    description: 'A gentle review quiz to check understanding of a story already covered in class.',
    category: 'bible_knowledge',
    assignmentType: 'quiz',
    referenceId: 'early-noah',
    instructions: 'Review the story, then answer the questions.',
    estimatedMinutes: 10,
    difficulty: 'easy',
    timeLimitMinutes: null,
    requiredScore: 60,
    xpReward: 25,
  },

  // ── Reading ──
  {
    title: 'Weekly Bible Reading',
    description: 'A standard weekly reading assignment tied to this week’s lesson.',
    category: 'reading',
    assignmentType: 'reading',
    referenceId: 'path-ruth',
    instructions: 'Read through this week’s lesson at your own pace.',
    estimatedMinutes: 15,
    difficulty: 'easy',
    timeLimitMinutes: null,
    requiredScore: null,
    xpReward: 20,
  },
  {
    title: 'Read & Reflect',
    description: 'A reading assignment paired with a short reflection prompt in the instructions.',
    category: 'reading',
    assignmentType: 'reading',
    referenceId: 'teen-james-faith',
    instructions: 'Read through the lesson, then be ready to talk about one thing that stood out to you.',
    estimatedMinutes: 20,
    difficulty: 'medium',
    timeLimitMinutes: null,
    requiredScore: null,
    xpReward: 25,
  },

  // ── Games ──
  {
    title: 'Weekly Bible Game Challenge',
    description: 'A fast, fun quiz-style game to reinforce the week’s Bible knowledge.',
    category: 'games',
    assignmentType: 'game',
    referenceId: 'lightning-quiz',
    instructions: 'Play through the challenge — try to beat your own best score.',
    estimatedMinutes: 10,
    difficulty: 'easy',
    timeLimitMinutes: null,
    requiredScore: null,
    xpReward: 25,
  },
  {
    title: 'Adventure World Challenge',
    description: 'A sequencing challenge from the Bible Adventure World game set.',
    category: 'games',
    assignmentType: 'game',
    referenceId: 'build-the-story',
    instructions: 'Put the story events back in the right order.',
    estimatedMinutes: 10,
    difficulty: 'medium',
    timeLimitMinutes: null,
    requiredScore: null,
    xpReward: 25,
  },

  // ── Stories ──
  {
    title: 'Interactive Bible Story',
    description: 'A full branching interactive story students play through at their own pace.',
    category: 'stories',
    assignmentType: 'story',
    referenceId: 'david-and-goliath',
    instructions: null,
    estimatedMinutes: getStory('david-and-goliath')?.estimatedMinutes || 15,
    difficulty: 'easy',
    timeLimitMinutes: null,
    requiredScore: null,
    xpReward: 40,
  },

  // ── Reflection ──
  {
    title: 'Bible Reflection',
    description: 'An open written reflection — you grade and give private feedback.',
    category: 'reflection',
    assignmentType: 'written',
    referenceId: null,
    instructions: 'Write 3-4 sentences about what this week’s lesson means to you.',
    estimatedMinutes: 10,
    difficulty: 'easy',
    timeLimitMinutes: null,
    requiredScore: null,
    xpReward: 20,
    ageGroupOverride: 'both',
  },
  {
    title: 'Faith in Real Life',
    description: 'A written reflection connecting faith to a real situation teens actually face.',
    category: 'reflection',
    assignmentType: 'written',
    referenceId: null,
    instructions: 'Think of a real situation you’ve faced (or might face) — how does this week’s lesson shape how you’d handle it? Write a few sentences.',
    estimatedMinutes: 15,
    difficulty: 'medium',
    timeLimitMinutes: null,
    requiredScore: null,
    xpReward: 25,
    ageGroupOverride: 'teen',
  },

  // ── Review ──
  {
    title: 'End-of-Week Bible Review',
    description: 'A cumulative review quiz covering everything from the week.',
    category: 'review',
    assignmentType: 'quiz',
    referenceId: 'path-exodus',
    instructions: 'This covers everything from the week — take your time.',
    estimatedMinutes: 20,
    difficulty: 'medium',
    timeLimitMinutes: 25,
    requiredScore: 70,
    xpReward: 40,
  },
];

function ageGroupForDraft(d: BuiltinDraft): TemplateAgeGroup {
  if (d.ageGroupOverride) return d.ageGroupOverride;
  if (!d.referenceId) return 'both';
  if (d.assignmentType === 'story') return storyAgeGroup(d.referenceId);
  if (d.assignmentType === 'reading' || d.assignmentType === 'quiz' || d.assignmentType === 'memory') return trackAgeGroup(d.referenceId);
  return 'both'; // games are shared across child/teen with adaptive difficulty — no content-level age gate today.
}

export const BUILT_IN_TEMPLATES: AssignmentTemplate[] = DRAFTS.map((d, i) => ({
  id: `builtin-${i}`,
  source: 'builtin',
  title: d.title,
  description: d.description,
  category: d.category,
  assignmentType: d.assignmentType,
  referenceId: d.referenceId,
  instructions: d.instructions,
  estimatedMinutes: d.estimatedMinutes,
  ageGroup: ageGroupForDraft(d),
  difficulty: d.difficulty,
  timeLimitMinutes: d.timeLimitMinutes,
  requiredScore: d.requiredScore,
  xpReward: d.xpReward,
}));
