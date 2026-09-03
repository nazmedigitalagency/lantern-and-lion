import type { SupabaseClient } from '@supabase/supabase-js';
import { activityDateKey, notifyOnce } from '../activity/server';

export type TeacherNotificationPreferences = {
  assignment_submissions: boolean;
  grading_reminders: boolean;
  challenge_updates: boolean;
  student_inactivity_alerts: boolean;
  upcoming_deadlines: boolean;
  upcoming_events: boolean;
};

export const DEFAULT_TEACHER_PREFERENCES: TeacherNotificationPreferences = {
  assignment_submissions: true,
  grading_reminders: true,
  challenge_updates: true,
  student_inactivity_alerts: true,
  upcoming_deadlines: true,
  upcoming_events: true,
};

export async function getTeacherNotificationPreferences(
  admin: SupabaseClient,
  teacherId: string
): Promise<TeacherNotificationPreferences> {
  const { data, error } = await admin
    .from('teacher_notification_preferences')
    .select('assignment_submissions, grading_reminders, challenge_updates, student_inactivity_alerts, upcoming_deadlines, upcoming_events')
    .eq('teacher_id', teacherId)
    .maybeSingle();

  if (error || !data) return { ...DEFAULT_TEACHER_PREFERENCES };

  return {
    assignment_submissions: data.assignment_submissions ?? true,
    grading_reminders: data.grading_reminders ?? true,
    challenge_updates: data.challenge_updates ?? true,
    student_inactivity_alerts: data.student_inactivity_alerts ?? true,
    upcoming_deadlines: data.upcoming_deadlines ?? true,
    upcoming_events: data.upcoming_events ?? true,
  };
}

export async function updateTeacherNotificationPreferences(
  admin: SupabaseClient,
  teacherId: string,
  updates: Partial<TeacherNotificationPreferences>
): Promise<TeacherNotificationPreferences> {
  const current = await getTeacherNotificationPreferences(admin, teacherId);
  const merged: TeacherNotificationPreferences = {
    ...current,
    ...updates,
  };

  await admin
    .from('teacher_notification_preferences')
    .upsert({
      teacher_id: teacherId,
      ...merged,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'teacher_id' });

  return merged;
}

export async function notifyTeacherAssignmentSubmitted(
  admin: SupabaseClient,
  params: {
    teacherId: string;
    assignmentId: string;
    assignmentTitle: string;
    studentName: string;
    childId: string;
    submissionId?: string;
  }
) {
  const prefs = await getTeacherNotificationPreferences(admin, params.teacherId);
  if (!prefs.assignment_submissions) return;

  await notifyOnce(admin, {
    recipientId: params.teacherId,
    childId: params.childId,
    type: 'TEACHER_ASSIGNMENT_SUBMITTED',
    title: 'Student submitted assignment',
    body: `${params.studentName} submitted "${params.assignmentTitle}".`,
    payload: {
      assignmentId: params.assignmentId,
      submissionId: params.submissionId,
      childId: params.childId,
      studentName: params.studentName,
      tab: 'gradebook',
    },
    dedupeKey: `teacher_submitted:${params.assignmentId}:${params.childId}`,
  });
}

export async function notifyTeacherChallengeCompleted(
  admin: SupabaseClient,
  params: {
    teacherId: string;
    challengeId: string;
    challengeName: string;
    classroomId: string;
  }
) {
  const prefs = await getTeacherNotificationPreferences(admin, params.teacherId);
  if (!prefs.challenge_updates) return;

  await notifyOnce(admin, {
    recipientId: params.teacherId,
    type: 'TEACHER_CHALLENGE_COMPLETED',
    title: 'Class challenge completed! 🎉',
    body: `Your class finished "${params.challengeName}" together!`,
    payload: {
      challengeId: params.challengeId,
      classroomId: params.classroomId,
      tab: 'challenges',
    },
    dedupeKey: `teacher_challenge_completed:${params.challengeId}`,
  });
}

/**
 * Reconciles non-spammy, actionable notifications for a teacher upon dashboard / notification center access:
 * - Awaiting grading notifications
 * - Upcoming assignment deadlines (< 48 hours)
 * - Inactive students requiring teacher attention (5+ days inactive)
 * - Upcoming classroom events
 */
export async function syncTeacherNotifications(admin: SupabaseClient, teacherId: string) {
  const prefs = await getTeacherNotificationPreferences(admin, teacherId);
  const todayKey = activityDateKey('UTC');
  const now = new Date();

  // 1. Awaiting grading
  if (prefs.grading_reminders) {
    const { data: classrooms } = await admin.from('classrooms').select('id').eq('teacher_id', teacherId);
    const classroomIds = (classrooms || []).map((c) => c.id);

    if (classroomIds.length > 0) {
      const { data: pendingSubmissions } = await admin
        .from('assignment_submissions')
        .select('id, assignment_id, assignments!inner(id, title, classroom_id)')
        .eq('status', 'submitted')
        .in('assignments.classroom_id', classroomIds);

      const count = pendingSubmissions?.length || 0;
      if (count > 0) {
        await notifyOnce(admin, {
          recipientId: teacherId,
          type: 'TEACHER_AWAITING_GRADING',
          title: 'Assignments awaiting grading',
          body: count === 1 ? '1 assignment is awaiting grading.' : `${count} assignments are awaiting grading.`,
          payload: { tab: 'gradebook' },
          dedupeKey: `teacher_awaiting_grading:${teacherId}:${todayKey}`,
        });
      }
    }
  }

  // 2. Upcoming assignment deadlines (< 48h)
  if (prefs.upcoming_deadlines) {
    const tomorrow = new Date(now.getTime() + 86_400_000);
    const tomorrowKey = activityDateKey('UTC', tomorrow);
    const inTwoDays = new Date(now.getTime() + 2 * 86_400_000);
    const inTwoDaysKey = activityDateKey('UTC', inTwoDays);

    const { data: upcomingAssignments } = await admin
      .from('assignments')
      .select('id, title, due_date, classroom_id, classrooms!inner(teacher_id)')
      .eq('classrooms.teacher_id', teacherId)
      .eq('status', 'assigned')
      .in('due_date', [todayKey, tomorrowKey, inTwoDaysKey]);

    for (const assignment of upcomingAssignments || []) {
      const isToday = assignment.due_date === todayKey;
      const isTomorrow = assignment.due_date === tomorrowKey;
      const timeLabel = isToday ? 'today' : isTomorrow ? 'tomorrow' : 'in 2 days';

      await notifyOnce(admin, {
        recipientId: teacherId,
        type: 'TEACHER_DEADLINE_APPROACHING',
        title: 'Assignment deadline approaching',
        body: `"${assignment.title}" is due ${timeLabel}.`,
        payload: { assignmentId: assignment.id, tab: 'assignments' },
        dedupeKey: `teacher_deadline:${assignment.id}:${assignment.due_date}`,
      });
    }
  }

  // 3. Students needing attention (inactive > 5 days)
  if (prefs.student_inactivity_alerts) {
    const { data: teacherClassrooms } = await admin.from('classrooms').select('id').eq('teacher_id', teacherId);
    const classroomIds = (teacherClassrooms || []).map((c) => c.id);

    if (classroomIds.length > 0) {
      const fiveDaysAgo = new Date(now.getTime() - 5 * 86_400_000).toISOString();
      const { data: students } = await admin
        .from('classroom_students')
        .select('child_id, children!inner(id, name, last_login_at)')
        .in('classroom_id', classroomIds)
        .eq('approved', true);

      for (const item of students || []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const child = (item as any).children;
        if (child && (!child.last_login_at || child.last_login_at < fiveDaysAgo)) {
          await notifyOnce(admin, {
            recipientId: teacherId,
            childId: child.id,
            type: 'TEACHER_STUDENT_ATTENTION',
            title: 'Student may need attention',
            body: `${child.name} has not logged in for 5+ days.`,
            payload: { childId: child.id, studentName: child.name, tab: 'students' },
            dedupeKey: `teacher_student_inactive:${child.id}:${todayKey.slice(0, 7)}`, // once per month
          });
        }
      }
    }
  }

  // 4. Classroom events approaching (today or tomorrow)
  if (prefs.upcoming_events) {
    const tomorrow = new Date(now.getTime() + 86_400_000);
    const tomorrowKey = activityDateKey('UTC', tomorrow);

    const { data: upcomingEvents } = await admin
      .from('classroom_events')
      .select('id, title, event_date, start_time')
      .eq('teacher_id', teacherId)
      .in('event_date', [todayKey, tomorrowKey]);

    for (const ev of upcomingEvents || []) {
      const isToday = ev.event_date === todayKey;
      const timeStr = ev.start_time ? ` at ${ev.start_time.slice(0, 5)}` : '';
      const dayStr = isToday ? 'today' : 'tomorrow';

      await notifyOnce(admin, {
        recipientId: teacherId,
        type: 'TEACHER_EVENT_APPROACHING',
        title: 'Classroom event approaching',
        body: `"${ev.title}" is scheduled for ${dayStr}${timeStr}.`,
        payload: { eventId: ev.id, tab: 'calendar' },
        dedupeKey: `teacher_event_alert:${ev.id}:${ev.event_date}`,
      });
    }
  }
}
