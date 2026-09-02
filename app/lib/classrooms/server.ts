import type { ActivityStatus, AgeGroup } from './types';

// A child is placed on the Teen track at the same age boundary already used
// for the "Ages 13-16" classroom band (see codePrefixForAgeBand in the
// teacher dashboard) and the curriculum's own teen track cutoff.
const TEEN_AGE_CUTOFF = 13;

// "Active" mirrors a school day; "recently active" mirrors the app's own
// weekly-consistency window (the streak calendar already looks back 7 days
// everywhere else in the product). "Needs attention" for inactivity reuses
// that same 7-day window rather than a new arbitrary number.
const ACTIVE_WITHIN_HOURS = 48;
const RECENT_WITHIN_DAYS = 7;
const INACTIVE_ATTENTION_DAYS = 7;

export function ageGroupForAge(age: number): AgeGroup {
  return age >= TEEN_AGE_CUTOFF ? 'teen' : 'child';
}

export function computeActivityStatus(lastActiveAt: string | null): ActivityStatus {
  if (!lastActiveAt) return 'inactive';
  const hoursSince = (Date.now() - new Date(lastActiveAt).getTime()) / 3_600_000;
  if (hoursSince <= ACTIVE_WITHIN_HOURS) return 'active';
  if (hoursSince <= RECENT_WITHIN_DAYS * 24) return 'recently_active';
  return 'inactive';
}

function daysSince(dateIso: string | null): number | null {
  if (!dateIso) return null;
  return Math.floor((Date.now() - new Date(dateIso).getTime()) / 86_400_000);
}

export type NeedsAttentionInput = {
  lastActiveAt: string | null;
  needsHelp: boolean;
  streakEndedRecently: boolean;
  strugglingConceptLabels: string[];
};

/**
 * Turns real, already-tracked signals into plain-language reasons a teacher
 * can act on — never a score or a comparison to other students, and never
 * shame-based language. Every reason here traces back to a real column:
 * classroom_students.needs_help, children.last_login_at, concept_mastery's
 * `needs_reinforcement` status, and the streak engine's own lapse signal.
 */
export function buildNeedsAttention(input: NeedsAttentionInput): { needsAttention: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const inactiveDays = daysSince(input.lastActiveAt);

  if (inactiveDays === null) {
    reasons.push("Hasn't started learning yet.");
  } else if (inactiveDays >= INACTIVE_ATTENTION_DAYS) {
    reasons.push(`Hasn't been active in ${inactiveDays} day${inactiveDays === 1 ? '' : 's'}.`);
  }

  if (input.needsHelp) {
    reasons.push('Asked for help and it hasn’t been reviewed yet.');
  }

  if (input.strugglingConceptLabels.length >= 2) {
    reasons.push(`Finding it tough with ${input.strugglingConceptLabels.slice(0, 2).join(' and ')} — a little extra practice could help.`);
  }

  if (input.streakEndedRecently && inactiveDays !== null && inactiveDays < INACTIVE_ATTENTION_DAYS) {
    // Only add this when it isn't already implied by the inactivity reason above.
    reasons.push('Their learning streak recently ended — a quick nudge could help them restart it.');
  }

  return { needsAttention: reasons.length > 0, reasons };
}
