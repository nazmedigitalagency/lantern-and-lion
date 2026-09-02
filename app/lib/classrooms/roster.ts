import type { SupabaseClient } from '@supabase/supabase-js';
import { getStreakCalendar, getStreakStatus } from '../streak/server';
import { getConceptMasteryForChild } from '../adaptive/server';
import { getConcept } from '../adaptive/concepts';
import { getLevelInfo } from '../xp-levels';
import { ageGroupForAge, buildNeedsAttention, computeActivityStatus } from './server';
import type { StudentCard } from './types';

export type ChildRow = { id: string; name: string; age: number; family_id: string; last_login_at: string | null };

/**
 * The shared per-student rollup (XP, level, streak, weekly activity,
 * mastery, needs-attention) behind every "My Students"-shaped view —
 * /api/teacher/students and the classroom detail route both call this
 * instead of computing it two different ways. Callers attach `classrooms`
 * themselves since that differs by context (every class a child is in,
 * vs. just the one classroom being viewed).
 */
export async function computeStudentCards(
  admin: SupabaseClient,
  children: ChildRow[],
  needsHelpByChild: Map<string, boolean>
): Promise<Map<string, Omit<StudentCard, 'classrooms'>>> {
  const result = new Map<string, Omit<StudentCard, 'classrooms'>>();
  if (children.length === 0) return result;
  const childIds = children.map((c) => c.id);

  const familyIds = Array.from(new Set(children.map((c) => c.family_id)));
  const { data: families } = await admin.from('families').select('id, timezone').in('id', familyIds);
  const timezoneByChild = new Map(children.map((c) => [c.id, families?.find((f) => f.id === c.family_id)?.timezone || 'UTC']));

  const { data: xpRows } = await admin.from('daily_activity_summary').select('child_id, xp_earned').in('child_id', childIds);
  const lifetimeXp = new Map<string, number>();
  for (const row of xpRows || []) lifetimeXp.set(row.child_id, (lifetimeXp.get(row.child_id) || 0) + (row.xp_earned || 0));

  await Promise.all(children.map(async (child) => {
    const tz = timezoneByChild.get(child.id) || 'UTC';
    const [streak, calendar, masteryRows] = await Promise.all([
      getStreakStatus(admin, child.id, tz),
      getStreakCalendar(admin, child.id, tz, 7),
      getConceptMasteryForChild(admin, child.id),
    ]);

    const weeklyActiveDays = calendar.filter((d) => d.state === 'complete' || d.state === 'grace').length;
    const masteryPercent = masteryRows.length ? Math.round(masteryRows.reduce((sum, m) => sum + m.mastery_score, 0) / masteryRows.length) : 0;
    const strugglingLabels = masteryRows.filter((m) => m.status === 'needs_reinforcement').map((m) => getConcept(m.concept_id)?.label || m.concept_id);

    const xp = lifetimeXp.get(child.id) || 0;
    const level = getLevelInfo(xp);
    const needsHelp = needsHelpByChild.get(child.id) || false;
    const { needsAttention, reasons } = buildNeedsAttention({
      lastActiveAt: child.last_login_at,
      needsHelp,
      streakEndedRecently: streak.streakEndedRecently,
      strugglingConceptLabels: strugglingLabels,
    });

    result.set(child.id, {
      id: child.id,
      name: child.name,
      age: child.age,
      ageGroup: ageGroupForAge(child.age),
      xp,
      level: level.level,
      levelTitle: level.title,
      currentStreak: streak.currentStreak,
      weeklyActiveDays,
      masteryPercent,
      masteryTracked: masteryRows.length > 0,
      lastActiveAt: child.last_login_at,
      activityStatus: computeActivityStatus(child.last_login_at),
      needsHelp,
      needsAttention,
      needsAttentionReasons: reasons,
    });
  }));

  return result;
}
