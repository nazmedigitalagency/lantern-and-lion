import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ATTENTION_THRESHOLDS, computeAttentionPriority } from '../app/lib/attention/config.ts';
import { buildNeedsAttention, computeActivityStatus, daysSince } from '../app/lib/classrooms/server.ts';

// computeStudentTrend / buildAttentionEntry (app/lib/insights/server.ts) pull
// in the adaptive/curriculum/story-catalog module graph, which this
// codebase writes with extensionless relative imports everywhere (fine for
// Next.js's bundler resolution, not resolvable by Node's native ESM loader
// running .ts files directly). Rather than touching dozens of unrelated
// import specifiers across already-shipped modules to make that graph
// runnable here, the trend/combination formulas below are exercised as
// contract tests against the real ATTENTION_THRESHOLDS values — the same
// pattern already used by tests/connection-consent.test.ts for logic that
// isn't cheaply import-safe under `node --test`.

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

/** Mirrors computeStudentTrend's score-based branch in app/lib/insights/server.ts. */
function trendFromScores(scoredChronological: number[]): { trend: 'improving' | 'declining' | 'stable' | 'insufficient_data'; diff: number | null } {
  const MIN_SCORED_FOR_TREND_SPLIT = 4;
  if (scoredChronological.length < MIN_SCORED_FOR_TREND_SPLIT) return { trend: 'insufficient_data', diff: null };
  const windowSize = Math.min(3, Math.floor(scoredChronological.length / 2));
  const recent = scoredChronological.slice(-windowSize);
  const prior = scoredChronological.slice(-windowSize * 2, -windowSize);
  const recentAvg = Math.round(recent.reduce((a, b) => a + b, 0) / recent.length);
  const priorAvg = Math.round(prior.reduce((a, b) => a + b, 0) / prior.length);
  const diff = recentAvg - priorAvg;
  if (diff >= ATTENTION_THRESHOLDS.QUIZ_DECLINE_MIN_POINTS) return { trend: 'improving', diff };
  if (diff <= -ATTENTION_THRESHOLDS.QUIZ_DECLINE_MIN_POINTS) return { trend: 'declining', diff };
  return { trend: 'stable', diff };
}

describe('Feature 14: Students Who Need Attention', () => {
  it('does NOT flag a student with normal, recent activity (avoids false alarms)', () => {
    const { needsAttention, reasons } = buildNeedsAttention({
      lastActiveAt: daysAgoIso(1),
      needsHelp: false,
      streakEndedRecently: false,
      strugglingConceptLabels: [],
    });
    assert.equal(needsAttention, false);
    assert.deepEqual(reasons, []);
  });

  it('does NOT flag a student for missing just one day, or being just under the inactivity floor', () => {
    const oneDayOff = buildNeedsAttention({
      lastActiveAt: daysAgoIso(1),
      needsHelp: false,
      streakEndedRecently: false,
      strugglingConceptLabels: ['Noah'],
    });
    assert.equal(oneDayOff.needsAttention, false);

    const belowInactivityFloor = buildNeedsAttention({
      lastActiveAt: daysAgoIso(ATTENTION_THRESHOLDS.INACTIVE_DAYS_TO_FLAG - 1),
      needsHelp: false,
      streakEndedRecently: false,
      strugglingConceptLabels: [],
    });
    assert.equal(belowInactivityFloor.needsAttention, false);
  });

  it('flags a student with no learning activity for the configured number of days, with a clear, dated reason', () => {
    const days = ATTENTION_THRESHOLDS.INACTIVE_DAYS_TO_FLAG;
    const { needsAttention, reasons } = buildNeedsAttention({
      lastActiveAt: daysAgoIso(days),
      needsHelp: false,
      streakEndedRecently: false,
      strugglingConceptLabels: [],
    });
    assert.equal(needsAttention, true);
    assert.ok(reasons.some((r) => r.includes('No learning activity for') && r.includes(String(days))));
  });

  it('treats a student who has never started as needing attention, without a false numeric claim', () => {
    const { needsAttention, reasons } = buildNeedsAttention({
      lastActiveAt: null,
      needsHelp: false,
      streakEndedRecently: false,
      strugglingConceptLabels: [],
    });
    assert.equal(needsAttention, true);
    assert.ok(reasons[0].toLowerCase().includes("hasn't started"));
  });

  it('requires repeated (not single) struggling concepts before flagging — avoids a false alarm from one wrong topic', () => {
    const single = buildNeedsAttention({
      lastActiveAt: daysAgoIso(1),
      needsHelp: false,
      streakEndedRecently: false,
      strugglingConceptLabels: ['David & Goliath'],
    });
    assert.equal(single.needsAttention, false);

    const repeated = buildNeedsAttention({
      lastActiveAt: daysAgoIso(1),
      needsHelp: false,
      streakEndedRecently: false,
      strugglingConceptLabels: ['David & Goliath', 'Noah'],
    });
    assert.equal(repeated.needsAttention, true);
    assert.ok(repeated.reasons[0].startsWith('Repeated difficulty with'));
  });

  it('never uses diagnostic, medical, or shaming language in any generated reason', () => {
    const forbidden = /diagnos|disorder|adhd|autis|depress|anxiety|lazy|bad student|failing student|problem student/i;
    const scenarios = [
      buildNeedsAttention({ lastActiveAt: null, needsHelp: true, streakEndedRecently: true, strugglingConceptLabels: ['A', 'B'] }),
      buildNeedsAttention({ lastActiveAt: daysAgoIso(20), needsHelp: false, streakEndedRecently: false, strugglingConceptLabels: [] }),
    ];
    for (const s of scenarios) {
      for (const r of s.reasons) assert.ok(!forbidden.test(r), `Unexpected language in: ${r}`);
    }
  });

  it('computes activity status consistently for active / recently-active / inactive / never-active students', () => {
    assert.equal(computeActivityStatus(new Date().toISOString()), 'active');
    assert.equal(computeActivityStatus(daysAgoIso(3)), 'recently_active');
    assert.equal(computeActivityStatus(daysAgoIso(10)), 'inactive');
    assert.equal(computeActivityStatus(null), 'inactive');
  });

  it('daysSince: null for a student with no recorded activity at all (insufficient historical data)', () => {
    assert.equal(daysSince(null), null);
    assert.equal(daysSince(daysAgoIso(5)), 5);
  });

  it('quiz trend: a single score is insufficient data — does NOT claim a decline from one bad quiz', () => {
    const trend = trendFromScores([61]);
    assert.equal(trend.trend, 'insufficient_data');
    assert.equal(trend.diff, null);
  });

  it('quiz trend: detects a real decline with a specific before/after percentage, matching the product spec example', () => {
    // Prior window average 87, recent window average 61 — a real, sustained drop.
    const trend = trendFromScores([88, 86, 87, 62, 60, 61]);
    assert.equal(trend.trend, 'declining');
    assert.ok(typeof trend.diff === 'number' && trend.diff <= -ATTENTION_THRESHOLDS.QUIZ_DECLINE_MIN_POINTS);
  });

  it('quiz trend: does NOT flag a small, normal fluctuation as a decline', () => {
    const trend = trendFromScores([80, 82, 81, 78, 79, 80]);
    assert.equal(trend.trend, 'stable');
  });

  it('priority: 3+ overdue assignments is High, matching the product spec example exactly', () => {
    assert.equal(ATTENTION_THRESHOLDS.OVERDUE_HIGH, 3);
    const priority = computeAttentionPriority({
      overdueCount: 3,
      inactiveDays: 1,
      trendDeclining: false,
      trendDiff: null,
      strugglingCount: 0,
      needsHelp: false,
    });
    assert.equal(priority, 'high');
  });

  it('priority: 1-2 overdue assignments is Medium, not High (proportionate escalation)', () => {
    const priority = computeAttentionPriority({
      overdueCount: 2,
      inactiveDays: 1,
      trendDeclining: false,
      trendDiff: null,
      strugglingCount: 0,
      needsHelp: false,
    });
    assert.equal(priority, 'medium');
  });

  it('priority: no activity for 5+ days (the configured floor) is at least Medium', () => {
    const priority = computeAttentionPriority({
      overdueCount: 0,
      inactiveDays: ATTENTION_THRESHOLDS.INACTIVE_DAYS_TO_FLAG,
      trendDeclining: false,
      trendDiff: null,
      strugglingCount: 0,
      needsHelp: false,
    });
    assert.equal(priority, 'medium');
  });

  it('priority: sustained inactivity (14+ days) escalates to High', () => {
    const priority = computeAttentionPriority({
      overdueCount: 0,
      inactiveDays: ATTENTION_THRESHOLDS.INACTIVE_DAYS_HIGH,
      trendDeclining: false,
      trendDiff: null,
      strugglingCount: 0,
      needsHelp: false,
    });
    assert.equal(priority, 'high');
  });

  it('priority: a small recent quiz decline alone is not High (avoids overreacting to one soft signal)', () => {
    const priority = computeAttentionPriority({
      overdueCount: 0,
      inactiveDays: 1,
      trendDeclining: true,
      trendDiff: -12,
      strugglingCount: 0,
      needsHelp: false,
    });
    assert.notEqual(priority, 'high');
    assert.equal(priority, 'medium');
  });

  it('priority: a large recent quiz decline escalates to High', () => {
    const priority = computeAttentionPriority({
      overdueCount: 0,
      inactiveDays: 1,
      trendDeclining: true,
      trendDiff: -30,
      strugglingCount: 0,
      needsHelp: false,
    });
    assert.equal(priority, 'high');
  });

  it('priority: no qualifying signal at all is Low', () => {
    const priority = computeAttentionPriority({
      overdueCount: 0,
      inactiveDays: 1,
      trendDeclining: false,
      trendDiff: null,
      strugglingCount: 0,
      needsHelp: false,
    });
    assert.equal(priority, 'low');
  });

  it('priority: multiple simultaneous signals resolve to the single highest applicable priority', () => {
    const priority = computeAttentionPriority({
      overdueCount: 1,
      inactiveDays: ATTENTION_THRESHOLDS.INACTIVE_DAYS_HIGH, // High on its own
      trendDeclining: true,
      trendDiff: -12, // Medium on its own
      strugglingCount: ATTENTION_THRESHOLDS.STRUGGLING_CONCEPTS_MIN,
      needsHelp: true,
    });
    assert.equal(priority, 'high');
  });

  it('alerts disappear once the underlying condition is resolved: a formerly-inactive, now-active student is no longer flagged', () => {
    const wasInactive = buildNeedsAttention({
      lastActiveAt: daysAgoIso(ATTENTION_THRESHOLDS.INACTIVE_DAYS_TO_FLAG),
      needsHelp: false,
      streakEndedRecently: false,
      strugglingConceptLabels: [],
    });
    assert.equal(wasInactive.needsAttention, true);

    const nowActive = buildNeedsAttention({
      lastActiveAt: daysAgoIso(0),
      needsHelp: false,
      streakEndedRecently: false,
      strugglingConceptLabels: [],
    });
    assert.equal(nowActive.needsAttention, false);
  });

  it('alerts disappear once overdue assignments are resolved: overdueCount dropping to 0 clears the priority escalation', () => {
    const withOverdue = computeAttentionPriority({ overdueCount: 3, inactiveDays: 1, trendDeclining: false, trendDiff: null, strugglingCount: 0, needsHelp: false });
    assert.equal(withOverdue, 'high');

    const resolved = computeAttentionPriority({ overdueCount: 0, inactiveDays: 1, trendDeclining: false, trendDiff: null, strugglingCount: 0, needsHelp: false });
    assert.equal(resolved, 'low');
  });
});
