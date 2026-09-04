import type { SupabaseClient } from '@supabase/supabase-js';
import { activityDateKey, notifyOnce } from '../activity/server';

import {
  DEFAULT_TEACHER_PREFERENCES,
  type TeacherNotificationPreferences,
} from '../notifications/types';

export {
  DEFAULT_TEACHER_PREFERENCES,
  type TeacherNotificationPreferences,
};

export async function getTeacherNotificationPreferences(
  admin: SupabaseClient,
  teacherId: string
): Promise<TeacherNotificationPreferences> {
  const { data, error } = await admin
    .from('teacher_notification_preferences')
    .select('*')
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
    class_achievements: data.class_achievements ?? true,
    learning_insights: data.learning_insights ?? true,
    connection_alerts: data.connection_alerts ?? true,
    missing_work_alerts: data.missing_work_alerts ?? true,
    student_performance_alerts: data.student_performance_alerts ?? true,
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
    priority: 'normal',
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
  if (!prefs.challenge_updates && !prefs.class_achievements) return;

  await notifyOnce(admin, {
    recipientId: params.teacherId,
    type: 'TEACHER_CHALLENGE_COMPLETED',
    title: 'Class challenge completed! 🎉',
    body: `Your class finished "${params.challengeName}" together!`,
    priority: 'normal',
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
 * - Deadlines approaching with uncompleted counts
 * - Awaiting grading notifications
 * - Students with 3+ missing assignments
 * - Students with performance decline
 * - Inactive students requiring attention (5+ days inactive)
 * - Class XP and activity milestones
 * - Class achievements & learning insights
 * - Upcoming classroom events
 */
export async function syncTeacherNotifications(admin: SupabaseClient, teacherId: string) {
  const prefs = await getTeacherNotificationPreferences(admin, teacherId);
  const todayKey = activityDateKey('UTC');
  const now = new Date();

  const { data: classrooms } = await admin
    .from('classrooms')
    .select('id, name')
    .eq('teacher_id', teacherId);

  const classroomList = classrooms || [];
  const classroomIds = classroomList.map((c) => c.id);
  const classroomMap = new Map(classroomList.map((c) => [c.id, c.name]));

  if (classroomIds.length === 0) return;

  // 1. Fetch approved students across teacher's classrooms
  const { data: enrolledStudents } = await admin
    .from('classroom_students')
    .select('classroom_id, child_id, children(id, name, last_login_at)')
    .in('classroom_id', classroomIds)
    .eq('approved', true);

  const enrolledByClass = new Map<string, Array<{ id: string; name: string; last_login_at: string | null }>>();
  const allEnrolledStudents: Array<{ id: string; name: string; last_login_at: string | null; classroomId: string }> = [];

  for (const row of enrolledStudents || []) {
    const ch = (row as unknown as { children: { id: string; name: string; last_login_at: string | null } | null }).children;
    if (ch) {
      const item = { id: ch.id, name: ch.name, last_login_at: ch.last_login_at, classroomId: row.classroom_id };
      allEnrolledStudents.push(item);
      const list = enrolledByClass.get(row.classroom_id) || [];
      list.push(item);
      enrolledByClass.set(row.classroom_id, list);
    }
  }

  // 2. Upcoming assignment deadlines (< 48h) with uncompleted student count
  if (prefs.upcoming_deadlines) {
    const tomorrow = new Date(now.getTime() + 86_400_000);
    const tomorrowKey = activityDateKey('UTC', tomorrow);

    const { data: upcomingAssignments } = await admin
      .from('assignments')
      .select('id, title, due_date, classroom_id')
      .in('classroom_id', classroomIds)
      .eq('status', 'assigned')
      .in('due_date', [todayKey, tomorrowKey]);

    for (const assignment of upcomingAssignments || []) {
      const isToday = assignment.due_date === todayKey;
      const dayLabel = isToday ? 'today' : 'tomorrow';
      const className = classroomMap.get(assignment.classroom_id) || 'Class';
      const enrolled = enrolledByClass.get(assignment.classroom_id) || [];

      // Query submissions for this assignment
      const { data: subs } = await admin
        .from('assignment_submissions')
        .select('child_id, status')
        .eq('assignment_id', assignment.id)
        .in('status', ['submitted', 'graded', 'returned']);

      const completedIds = new Set((subs || []).map((s) => s.child_id));
      const uncompletedCount = enrolled.filter((st) => !completedIds.has(st.id)).length;

      if (uncompletedCount > 0) {
        await notifyOnce(admin, {
          recipientId: teacherId,
          type: 'TEACHER_ASSIGNMENT_UNCOMPLETED_ALERT',
          title: `Assignment due ${dayLabel}`,
          body: `${uncompletedCount} student${uncompletedCount === 1 ? " hasn't" : "s haven't"} completed "${assignment.title}".`,
          priority: 'high',
          payload: {
            assignmentId: assignment.id,
            classroomId: assignment.classroom_id,
            className,
            uncompletedCount,
            tab: 'assignments',
          },
          dedupeKey: `teacher_uncompleted:${assignment.id}:${assignment.due_date}`,
        });
      } else {
        await notifyOnce(admin, {
          recipientId: teacherId,
          type: 'TEACHER_DEADLINE_APPROACHING',
          title: 'Assignment deadline approaching',
          body: `"${assignment.title}" is due ${dayLabel}.`,
          priority: 'normal',
          payload: { assignmentId: assignment.id, classroomId: assignment.classroom_id, className, tab: 'assignments' },
          dedupeKey: `teacher_deadline:${assignment.id}:${assignment.due_date}`,
        });
      }
    }
  }

  // 3. Awaiting grading reminders
  if (prefs.grading_reminders) {
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
        priority: 'normal',
        payload: { tab: 'gradebook' },
        dedupeKey: `teacher_awaiting_grading:${teacherId}:${todayKey}`,
      });
    }
  }

  // 4. Students missing 3+ assignments
  if (prefs.missing_work_alerts) {
    // Fetch all active assignments that are past due
    const { data: overdueAssignments } = await admin
      .from('assignments')
      .select('id, classroom_id, title')
      .in('classroom_id', classroomIds)
      .eq('status', 'assigned')
      .lte('due_date', todayKey);

    if (overdueAssignments && overdueAssignments.length >= 3) {
      const assignmentIds = overdueAssignments.map((a) => a.id);
      const { data: subs } = await admin
        .from('assignment_submissions')
        .select('assignment_id, child_id, status')
        .in('assignment_id', assignmentIds);

      const completedPairs = new Set(
        (subs || [])
          .filter((s) => ['submitted', 'graded', 'returned'].includes(s.status))
          .map((s) => `${s.child_id}:${s.assignment_id}`)
      );

      for (const student of allEnrolledStudents) {
        const classAssignments = overdueAssignments.filter((a) => a.classroom_id === student.classroomId);
        const missingCount = classAssignments.filter((a) => !completedPairs.has(`${student.id}:${a.id}`)).length;

        if (missingCount >= 3) {
          await notifyOnce(admin, {
            recipientId: teacherId,
            childId: student.id,
            type: 'TEACHER_STUDENT_MISSING_WORK',
            title: 'Missing assignments alert',
            body: `${student.name} hasn't completed ${missingCount} assignments.`,
            priority: 'high',
            payload: { childId: student.id, studentName: student.name, missingCount, tab: 'students' },
            dedupeKey: `teacher_missing_work:${student.id}:${todayKey.slice(0, 7)}`,
          });
        }
      }
    }
  }

  // 5. Students needing attention (inactive > 5 days)
  if (prefs.student_inactivity_alerts) {
    const fiveDaysAgo = new Date(now.getTime() - 5 * 86_400_000).toISOString();
    for (const student of allEnrolledStudents) {
      if (!student.last_login_at || student.last_login_at < fiveDaysAgo) {
        await notifyOnce(admin, {
          recipientId: teacherId,
          childId: student.id,
          type: 'TEACHER_STUDENT_ATTENTION',
          title: 'Student may need attention',
          body: `${student.name} has not logged in for 5+ days.`,
          priority: 'high',
          payload: { childId: student.id, studentName: student.name, tab: 'students' },
          dedupeKey: `teacher_student_inactive:${student.id}:${todayKey.slice(0, 7)}`,
        });
      }
    }
  }

  // 6. Student quiz performance decline alert
  if (prefs.student_performance_alerts) {
    for (const student of allEnrolledStudents) {
      const { data: recentScores } = await admin
        .from('assignment_submissions')
        .select('id, score, graded_at')
        .eq('child_id', student.id)
        .not('score', 'is', null)
        .order('graded_at', { ascending: false })
        .limit(4);

      if (recentScores && recentScores.length >= 3) {
        const latest = recentScores[0].score;
        const previous = recentScores.slice(1);
        const prevAvg = previous.reduce((sum, r) => sum + (r.score || 0), 0) / previous.length;

        // If established average was good (>=75) and latest dropped sharply (<60)
        if (prevAvg >= 75 && latest !== null && latest < 60) {
          await notifyOnce(admin, {
            recipientId: teacherId,
            childId: student.id,
            type: 'TEACHER_STUDENT_PERFORMANCE_ALERT',
            title: 'Quiz performance alert',
            body: `${student.name}'s recent quiz performance has declined.`,
            priority: 'high',
            payload: { childId: student.id, studentName: student.name, latestScore: latest, tab: 'students' },
            dedupeKey: `teacher_perf_decline:${student.id}:${recentScores[0].id}`,
          });
        }
      }
    }
  }

  // 7. Class XP & Bible activities milestones
  if (prefs.class_achievements) {
    for (const classroom of classroomList) {
      const enrolled = enrolledByClass.get(classroom.id) || [];
      const childIds = enrolled.map((s) => s.id);

      if (childIds.length > 0) {
        const { data: activityRows } = await admin
          .from('daily_activity_summary')
          .select('xp_earned, lessons_completed, games_completed')
          .in('child_id', childIds);

        const totalXp = (activityRows || []).reduce((sum, r) => sum + (r.xp_earned || 0), 0);
        const totalActivities = (activityRows || []).reduce((sum, r) => sum + (r.lessons_completed || 0) + (r.games_completed || 0), 0);

        // XP Milestones
        const xpMilestones = [1000, 5000, 10000, 25000];
        for (const ms of xpMilestones) {
          if (totalXp >= ms) {
            await notifyOnce(admin, {
              recipientId: teacherId,
              type: 'TEACHER_CLASS_XP_MILESTONE',
              title: 'Class XP milestone reached! 🌟',
              body: `Your class "${classroom.name}" reached ${ms.toLocaleString()} XP.`,
              priority: 'normal',
              payload: { classroomId: classroom.id, className: classroom.name, xp: ms, tab: 'classes' },
              dedupeKey: `teacher_class_xp:${classroom.id}:${ms}`,
            });
          }
        }

        // Activities Milestones
        const actMilestones = [50, 100, 250, 500];
        for (const ms of actMilestones) {
          if (totalActivities >= ms) {
            await notifyOnce(admin, {
              recipientId: teacherId,
              type: 'TEACHER_CLASS_ACTIVITIES_MILESTONE',
              title: 'Bible activities milestone! 📖',
              body: `Your class "${classroom.name}" completed ${ms} Bible activities.`,
              priority: 'normal',
              payload: { classroomId: classroom.id, className: classroom.name, count: ms, tab: 'classes' },
              dedupeKey: `teacher_class_act:${classroom.id}:${ms}`,
            });
          }
        }
      }
    }
  }

  // 8. Class achievement / challenge unlocked
  if (prefs.class_achievements) {
    for (const classroom of classroomList) {
      const { data: completedChallenges } = await admin
        .from('class_challenges')
        .select('id, name')
        .eq('classroom_id', classroom.id)
        .eq('status', 'completed')
        .limit(1);

      if (completedChallenges && completedChallenges.length > 0) {
        await notifyOnce(admin, {
          recipientId: teacherId,
          type: 'TEACHER_CLASS_ACHIEVEMENT',
          title: 'Achievement unlocked! 🏆',
          body: `Your class unlocked Scripture Champion.`,
          priority: 'normal',
          payload: { classroomId: classroom.id, challengeId: completedChallenges[0].id, tab: 'challenges' },
          dedupeKey: `teacher_class_achieve:${classroom.id}:scripture_champion`,
        });
      }
    }
  }

  // 9. Learning insights
  if (prefs.learning_insights) {
    for (const classroom of classroomList) {
      await notifyOnce(admin, {
        recipientId: teacherId,
        type: 'TEACHER_LEARNING_INSIGHT',
        title: 'Learning insight 💡',
        body: `Your class improved Scripture recall this week.`,
        priority: 'low',
        payload: { classroomId: classroom.id, className: classroom.name, tab: 'insights' },
        dedupeKey: `teacher_learning_insight:${classroom.id}:${todayKey.slice(0, 7)}`,
      });
    }
  }

  // 10. Classroom events approaching (today or tomorrow)
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
        priority: 'low',
        payload: { eventId: ev.id, tab: 'calendar' },
        dedupeKey: `teacher_event_alert:${ev.id}:${ev.event_date}`,
      });
    }
  }
}

