// Teacher Insights — shared types. Everything here is a rollup of data that
// already exists (StudentCard, assignment_submissions, concept_mastery); this
// file adds no new source-of-truth tables, only read-side aggregation shapes.

import type { AssignmentType } from '../assignments/types';
import type { AttentionPriority } from '../attention/config';

export type { AttentionPriority };

export type MetricKey = 'quiz' | 'memory' | 'reading' | 'story_completion' | 'bible_knowledge' | 'assignment_completion' | 'consistency';

export type ClassMetric = {
  key: MetricKey;
  emoji: string;
  label: string;
  /** 0-100. */
  value: number;
  /** How many real data points this is built from — shown so a small sample isn't mistaken for a firm number. */
  sampleSize: number;
  sampleUnit: string;
};

export type TopicInsight = {
  conceptId: string;
  label: string;
  /** 0-100 average mastery across the students tracking it. */
  avgMastery: number;
  studentCount: number;
};

/** A single, real target an insight's [Create Assignment] button can prefill — the same shape CreateAssignmentModal already accepts as a template. */
export type SuggestedAssignment = {
  title: string;
  instructions: string | null;
  assignmentType: AssignmentType;
  referenceId: string | null;
  ageGroup: 'child' | 'teen' | 'both';
};

export type ClassInsight = {
  id: string;
  tone: 'strength' | 'practice';
  emoji: string;
  headline: string;
  detail: string | null;
  action?: { label: string; suggestedAssignment?: SuggestedAssignment; viewStudentsOnly?: boolean };
};

export type AttentionEntry = {
  studentId: string;
  name: string;
  reasons: string[];
  /** Worst-case severity across every real signal that fired for this student — see app/lib/attention/config.ts. */
  priority: AttentionPriority;
  /** For "as of" context in the UI — never a diagnosis, just the most recent recorded activity. */
  lastActiveAt: string | null;
};

export type ImprovingEntry = {
  studentId: string;
  name: string;
  detail: string;
};

export type StudentTrend = {
  trend: 'improving' | 'declining' | 'stable' | 'insufficient_data';
  detail: string | null;
  /** Recent-vs-prior percentage-point difference when computed from real graded scores; null when the trend came from the coarser mastery-streak fallback. */
  diff: number | null;
};

export type StudentRecommendation = {
  headline: string;
  recommendation: string | null;
  suggestedAssignment: SuggestedAssignment | null;
};

export type ClassInsightsResponse = {
  classrooms: { id: string; name: string }[];
  scope: { classroomId: string | null; studentCount: number };
  overview: ClassMetric[];
  strengths: ClassInsight[];
  areasToPractice: ClassInsight[];
  topics: { strong: TopicInsight[]; needsPractice: TopicInsight[]; mostPracticed: TopicInsight[]; recentlyImproved: TopicInsight[] };
  needsAttention: AttentionEntry[];
  improving: ImprovingEntry[];
};

export type StudentInsightsResponse = {
  strengths: { conceptId: string; label: string; masteryScore: number }[];
  needsPractice: { conceptId: string; label: string; masteryScore: number }[];
  trend: StudentTrend;
  recommendation: StudentRecommendation | null;
};
