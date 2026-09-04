import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { CalendarItem, CalendarItemType } from '../app/api/teacher/calendar/route.ts';
import { TYPE_CONFIG } from '../app/lib/calendar/config.ts';
import {
  teacherNotificationDestination,
  TEACHER_NOTIFICATION_DEFAULT_PRIORITY,
  TEACHER_NOTIFICATION_ICON,
  type TeacherNotification,
} from '../app/lib/notifications/types.ts';
import { formatDateKey, getTodayDateKey } from '../app/lib/date.ts';

// ── Mock Helpers for Calendar Simulation ─────────────────────────

type MockAssignment = {
  id: string;
  title: string;
  assignment_type: string;
  instructions?: string;
  due_date: string | null;
  status: string;
  classroom_id: string;
};

type MockSubmission = {
  assignment_id: string;
  child_id: string;
  status: 'assigned' | 'submitted' | 'graded' | 'returned';
};

type MockChallenge = {
  id: string;
  name: string;
  description?: string;
  goal_type: string;
  goal_target: number;
  start_date: string;
  end_date: string;
  status: string;
  classroom_id: string;
};

type MockClassroom = {
  id: string;
  name: string;
  teacher_id: string;
};

type MockEvent = {
  id: string;
  title: string;
  event_type: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  description?: string;
  classroom_id: string;
  teacher_id: string;
};

/**
 * Pure simulation of the server logic in /api/teacher/calendar/route.ts
 */
function simulateCalendarQuery({
  teacherId,
  classrooms,
  requestedClassroomId,
  assignments,
  submissions,
  enrolledStudentsCountByClass,
  challenges,
  events,
}: {
  teacherId: string;
  classrooms: MockClassroom[];
  requestedClassroomId?: string | null;
  assignments: MockAssignment[];
  submissions: MockSubmission[];
  enrolledStudentsCountByClass: Record<string, number>;
  challenges: MockChallenge[];
  events: MockEvent[];
}): { status: number; items?: CalendarItem[]; error?: string } {
  // 1. Authorization: teacher classrooms only
  const teacherClasses = classrooms.filter((c) => c.teacher_id === teacherId);

  if (requestedClassroomId) {
    const isOwned = teacherClasses.some((c) => c.id === requestedClassroomId);
    if (!isOwned) {
      return { status: 403, error: 'Classroom not found or unauthorized.' };
    }
  }

  const allowedClasses = requestedClassroomId
    ? teacherClasses.filter((c) => c.id === requestedClassroomId)
    : teacherClasses;

  const allowedIds = new Set(allowedClasses.map((c) => c.id));
  const classMap = new Map(allowedClasses.map((c) => [c.id, c.name]));

  const items: CalendarItem[] = [];

  // 2. Submissions grouping
  const subStats = new Map<string, { completed: number; total: number }>();
  for (const s of submissions) {
    const entry = subStats.get(s.assignment_id) || { completed: 0, total: 0 };
    entry.total += 1;
    if (['submitted', 'graded', 'returned'].includes(s.status)) {
      entry.completed += 1;
    }
    subStats.set(s.assignment_id, entry);
  }

  // 3. Assignments
  for (const a of assignments) {
    if (!allowedIds.has(a.classroom_id) || !a.due_date) continue;

    const classSize = enrolledStudentsCountByClass[a.classroom_id] || 0;
    const stat = subStats.get(a.id) || { completed: 0, total: 0 };
    const totalTarget = classSize > 0 ? classSize : stat.total;
    const completedCount = stat.completed;
    const incompleteCount = Math.max(0, totalTarget - completedCount);

    let statusLabel: string;
    if (incompleteCount > 0 && totalTarget > 0) {
      statusLabel = `${incompleteCount} student${incompleteCount === 1 ? '' : 's'} incomplete`;
    } else if (totalTarget > 0 && incompleteCount === 0) {
      statusLabel = `All ${totalTarget} completed`;
    } else {
      statusLabel = a.status === 'assigned' ? 'Assigned' : (a.status || 'Active');
    }

    let itemType: CalendarItemType = 'assignment';
    let subtitle = 'Assignment Due';

    if (a.assignment_type === 'memory') {
      itemType = 'scripture_memory';
      subtitle = 'Scripture Memory Due';
    } else if (a.assignment_type === 'story') {
      itemType = 'bible_adventure';
      subtitle = 'Bible Adventure Chapter';
    }

    items.push({
      id: `assignment-${a.id}`,
      type: itemType,
      title: a.title,
      subtitle,
      date: a.due_date,
      classroomId: a.classroom_id,
      classroomName: classMap.get(a.classroom_id) || 'Class',
      status: statusLabel,
      assignmentType: a.assignment_type,
      totalStudents: totalTarget,
      completedCount,
      incompleteCount,
      description: a.instructions,
      meta: { assignmentId: a.id },
    });
  }

  // 4. Challenges
  for (const ch of challenges) {
    if (!allowedIds.has(ch.classroom_id)) continue;
    const goalSubtitle = `Goal: ${ch.goal_target} ${ch.goal_type}`;

    items.push({
      id: `challenge-start-${ch.id}`,
      type: 'challenge',
      title: `${ch.name} (Starts)`,
      subtitle: `${goalSubtitle} · Begins`,
      date: ch.start_date,
      endDate: ch.end_date,
      classroomId: ch.classroom_id,
      classroomName: classMap.get(ch.classroom_id) || 'Class',
      status: ch.status === 'active' ? 'Active Challenge' : ch.status,
      description: ch.description,
      meta: { challengeId: ch.id },
    });

    if (ch.end_date !== ch.start_date) {
      items.push({
        id: `challenge-end-${ch.id}`,
        type: 'challenge',
        title: `${ch.name} (Ends)`,
        subtitle: `${goalSubtitle} · Deadline`,
        date: ch.end_date,
        endDate: ch.end_date,
        classroomId: ch.classroom_id,
        classroomName: classMap.get(ch.classroom_id) || 'Class',
        status: ch.status === 'active' ? 'Active Challenge' : ch.status,
        description: ch.description,
        meta: { challengeId: ch.id },
      });
    }
  }

  // 5. Events
  for (const ev of events) {
    if (!allowedIds.has(ev.classroom_id)) continue;
    const isScriptureMemory = ev.event_type === 'scripture_challenge';
    items.push({
      id: `event-${ev.id}`,
      type: isScriptureMemory ? 'scripture_memory' : 'event',
      title: ev.title,
      subtitle: isScriptureMemory ? 'Scripture Memory Event' : ev.event_type,
      date: ev.event_date,
      time: ev.start_time,
      classroomId: ev.classroom_id,
      classroomName: classMap.get(ev.classroom_id) || 'Class',
      status: 'Scheduled',
      description: ev.description,
      meta: { eventId: ev.id },
    });
  }

  // Sort
  items.sort((a, b) => a.date.localeCompare(b.date));

  return { status: 200, items };
}

describe('Feature 16: Teacher Classroom Calendar', () => {
  const teacherId = 'teacher-sarah';
  const otherTeacherId = 'teacher-imposter';

  const mockClassrooms: MockClassroom[] = [
    { id: 'class-wed', name: 'Wednesday Explorers', teacher_id: teacherId },
    { id: 'class-fri', name: 'Friday Teen Circle', teacher_id: teacherId },
    { id: 'class-other', name: 'St. Jude Sunday School', teacher_id: otherTeacherId },
  ];

  describe('1. Assignment lifecycle on calendar (live reflection, no duplicate records)', () => {
    it('automatically displays assignments with existing due dates on the calendar', () => {
      const assignments: MockAssignment[] = [
        {
          id: 'assign-1',
          title: 'David & Goliath Reading',
          assignment_type: 'reading',
          due_date: '2026-09-04',
          status: 'assigned',
          classroom_id: 'class-wed',
        },
      ];

      const res = simulateCalendarQuery({
        teacherId,
        classrooms: mockClassrooms,
        assignments,
        submissions: [],
        enrolledStudentsCountByClass: { 'class-wed': 8 },
        challenges: [],
        events: [],
      });

      assert.equal(res.status, 200);
      assert.equal(res.items?.length, 1);
      const item = res.items?.[0];
      assert.equal(item?.id, 'assignment-assign-1');
      assert.equal(item?.title, 'David & Goliath Reading');
      assert.equal(item?.date, '2026-09-04');
      assert.equal(item?.type, 'assignment');
      assert.equal(item?.classroomName, 'Wednesday Explorers');
    });

    it('updates the calendar automatically when an assignment date changes', () => {
      // Simulate teacher editing due date from Sept 4 to Sept 10
      const assignmentsAfterEdit: MockAssignment[] = [
        {
          id: 'assign-1',
          title: 'David & Goliath Reading',
          assignment_type: 'reading',
          due_date: '2026-09-10', // updated date
          status: 'assigned',
          classroom_id: 'class-wed',
        },
      ];

      const res = simulateCalendarQuery({
        teacherId,
        classrooms: mockClassrooms,
        assignments: assignmentsAfterEdit,
        submissions: [],
        enrolledStudentsCountByClass: { 'class-wed': 8 },
        challenges: [],
        events: [],
      });

      assert.equal(res.items?.length, 1);
      assert.equal(res.items?.[0].date, '2026-09-10');
    });

    it('removes assignment from calendar automatically when deleted (no stale duplicates)', () => {
      // Deleting assignment leaves empty assignments array
      const assignmentsAfterDelete: MockAssignment[] = [];

      const res = simulateCalendarQuery({
        teacherId,
        classrooms: mockClassrooms,
        assignments: assignmentsAfterDelete,
        submissions: [],
        enrolledStudentsCountByClass: { 'class-wed': 8 },
        challenges: [],
        events: [],
      });

      assert.equal(res.items?.length, 0);
    });
  });

  describe('2. Scripture Memory & Bible Adventure Classification', () => {
    it('classifies memory assignments with scripture_memory type and 🧠 icon', () => {
      const assignments: MockAssignment[] = [
        {
          id: 'assign-mem',
          title: 'Psalm 23:1 Memory Verse',
          assignment_type: 'memory',
          due_date: '2026-09-08',
          status: 'assigned',
          classroom_id: 'class-wed',
        },
      ];

      const res = simulateCalendarQuery({
        teacherId,
        classrooms: mockClassrooms,
        assignments,
        submissions: [],
        enrolledStudentsCountByClass: { 'class-wed': 8 },
        challenges: [],
        events: [],
      });

      const item = res.items?.[0];
      assert.equal(item?.type, 'scripture_memory');
      assert.equal(item?.subtitle, 'Scripture Memory Due');
      assert.equal(TYPE_CONFIG.scripture_memory.icon, '🧠');
      assert.equal(TYPE_CONFIG.scripture_memory.badgeClass, 'cal-badge-memory');
    });

    it('classifies story assignments with bible_adventure type and 📚 icon', () => {
      const assignments: MockAssignment[] = [
        {
          id: 'assign-story',
          title: 'Noah and the Ark: Interactive Chapter',
          assignment_type: 'story',
          due_date: '2026-09-15',
          status: 'assigned',
          classroom_id: 'class-wed',
        },
      ];

      const res = simulateCalendarQuery({
        teacherId,
        classrooms: mockClassrooms,
        assignments,
        submissions: [],
        enrolledStudentsCountByClass: { 'class-wed': 8 },
        challenges: [],
        events: [],
      });

      const item = res.items?.[0];
      assert.equal(item?.type, 'bible_adventure');
      assert.equal(item?.subtitle, 'Bible Adventure Chapter');
      assert.equal(TYPE_CONFIG.bible_adventure.icon, '📚');
      assert.equal(TYPE_CONFIG.bible_adventure.badgeClass, 'cal-badge-adventure');
    });
  });

  describe('3. Student Incomplete & Completion Metrics', () => {
    it('computes incomplete student counts accurately (e.g. 6 students incomplete)', () => {
      const assignments: MockAssignment[] = [
        {
          id: 'assign-1',
          title: 'David & Goliath Assignment',
          assignment_type: 'quiz',
          due_date: '2026-09-05',
          status: 'assigned',
          classroom_id: 'class-wed',
        },
      ];

      // 8 enrolled students, 2 have completed
      const submissions: MockSubmission[] = [
        { assignment_id: 'assign-1', child_id: 'c1', status: 'submitted' },
        { assignment_id: 'assign-1', child_id: 'c2', status: 'graded' },
      ];

      const res = simulateCalendarQuery({
        teacherId,
        classrooms: mockClassrooms,
        assignments,
        submissions,
        enrolledStudentsCountByClass: { 'class-wed': 8 },
        challenges: [],
        events: [],
      });

      const item = res.items?.[0];
      assert.equal(item?.totalStudents, 8);
      assert.equal(item?.completedCount, 2);
      assert.equal(item?.incompleteCount, 6);
      assert.equal(item?.status, '6 students incomplete');
    });

    it('marks status as All completed when all enrolled students finish', () => {
      const assignments: MockAssignment[] = [
        {
          id: 'assign-1',
          title: 'Creation Quiz',
          assignment_type: 'quiz',
          due_date: '2026-09-05',
          status: 'assigned',
          classroom_id: 'class-wed',
        },
      ];

      // 2 enrolled students, both finished
      const submissions: MockSubmission[] = [
        { assignment_id: 'assign-1', child_id: 'c1', status: 'submitted' },
        { assignment_id: 'assign-1', child_id: 'c2', status: 'returned' },
      ];

      const res = simulateCalendarQuery({
        teacherId,
        classrooms: mockClassrooms,
        assignments,
        submissions,
        enrolledStudentsCountByClass: { 'class-wed': 2 },
        challenges: [],
        events: [],
      });

      const item = res.items?.[0];
      assert.equal(item?.incompleteCount, 0);
      assert.equal(item?.status, 'All 2 completed');
    });
  });

  describe('4. Class Challenges on Calendar', () => {
    it('shows challenge on start date and goal deadline', () => {
      const challenges: MockChallenge[] = [
        {
          id: 'chal-sep',
          name: 'September Scripture Challenge',
          goal_type: 'verses',
          goal_target: 10,
          start_date: '2026-09-01',
          end_date: '2026-09-12',
          status: 'active',
          classroom_id: 'class-wed',
        },
      ];

      const res = simulateCalendarQuery({
        teacherId,
        classrooms: mockClassrooms,
        assignments: [],
        submissions: [],
        enrolledStudentsCountByClass: {},
        challenges,
        events: [],
      });

      assert.equal(res.items?.length, 2);
      const start = res.items?.find((i) => i.id === 'challenge-start-chal-sep');
      const end = res.items?.find((i) => i.id === 'challenge-end-chal-sep');

      assert.ok(start);
      assert.equal(start?.date, '2026-09-01');
      assert.equal(start?.title, 'September Scripture Challenge (Starts)');
      assert.equal(start?.type, 'challenge');

      assert.ok(end);
      assert.equal(end?.date, '2026-09-12');
      assert.equal(end?.title, 'September Scripture Challenge (Ends)');
    });

    it('updates challenge on calendar when start or end date changes', () => {
      const challenges: MockChallenge[] = [
        {
          id: 'chal-sep',
          name: 'September Scripture Challenge',
          goal_type: 'verses',
          goal_target: 10,
          start_date: '2026-09-02', // updated
          end_date: '2026-09-15', // updated
          status: 'active',
          classroom_id: 'class-wed',
        },
      ];

      const res = simulateCalendarQuery({
        teacherId,
        classrooms: mockClassrooms,
        assignments: [],
        submissions: [],
        enrolledStudentsCountByClass: {},
        challenges,
        events: [],
      });

      const start = res.items?.find((i) => i.id === 'challenge-start-chal-sep');
      const end = res.items?.find((i) => i.id === 'challenge-end-chal-sep');
      assert.equal(start?.date, '2026-09-02');
      assert.equal(end?.date, '2026-09-15');
    });
  });

  describe('5. Multiple Classrooms and Classroom Filtering', () => {
    const multiAssignments: MockAssignment[] = [
      {
        id: 'assign-w1',
        title: 'Wednesday Assignment',
        assignment_type: 'quiz',
        due_date: '2026-09-04',
        status: 'assigned',
        classroom_id: 'class-wed',
      },
      {
        id: 'assign-f1',
        title: 'Friday Teen Study',
        assignment_type: 'reading',
        due_date: '2026-09-06',
        status: 'assigned',
        classroom_id: 'class-fri',
      },
    ];

    it('returns all classrooms when no filter is provided', () => {
      const res = simulateCalendarQuery({
        teacherId,
        classrooms: mockClassrooms,
        requestedClassroomId: null,
        assignments: multiAssignments,
        submissions: [],
        enrolledStudentsCountByClass: {},
        challenges: [],
        events: [],
      });

      assert.equal(res.items?.length, 2);
    });

    it('filters accurately by classroomId when requested', () => {
      const res = simulateCalendarQuery({
        teacherId,
        classrooms: mockClassrooms,
        requestedClassroomId: 'class-fri',
        assignments: multiAssignments,
        submissions: [],
        enrolledStudentsCountByClass: {},
        challenges: [],
        events: [],
      });

      assert.equal(res.items?.length, 1);
      assert.equal(res.items?.[0].classroomId, 'class-fri');
      assert.equal(res.items?.[0].classroomName, 'Friday Teen Circle');
    });
  });

  describe('6. Security & Multi-Tenant Authorization Enforcement', () => {
    it('returns 403 Forbidden when an unauthorized classroomId is requested', () => {
      const res = simulateCalendarQuery({
        teacherId,
        classrooms: mockClassrooms,
        requestedClassroomId: 'class-other', // belongs to teacher-imposter
        assignments: [],
        submissions: [],
        enrolledStudentsCountByClass: {},
        challenges: [],
        events: [],
      });

      assert.equal(res.status, 403);
      assert.equal(res.error, 'Classroom not found or unauthorized.');
      assert.equal(res.items, undefined);
    });

    it('never leaks assignments from classrooms belonging to other teachers', () => {
      const leakedAssignments: MockAssignment[] = [
        {
          id: 'assign-secret',
          title: 'Other School Secret Quiz',
          assignment_type: 'quiz',
          due_date: '2026-09-05',
          status: 'assigned',
          classroom_id: 'class-other', // other teacher
        },
      ];

      const res = simulateCalendarQuery({
        teacherId,
        classrooms: mockClassrooms,
        requestedClassroomId: null,
        assignments: leakedAssignments,
        submissions: [],
        enrolledStudentsCountByClass: {},
        challenges: [],
        events: [],
      });

      assert.equal(res.status, 200);
      assert.equal(res.items?.length, 0); // Excluded!
    });
  });

  describe('7. Empty Calendar Handling', () => {
    it('handles empty classroom calendar gracefully with empty items array', () => {
      const res = simulateCalendarQuery({
        teacherId,
        classrooms: mockClassrooms,
        assignments: [],
        submissions: [],
        enrolledStudentsCountByClass: {},
        challenges: [],
        events: [],
      });

      assert.equal(res.status, 200);
      assert.deepEqual(res.items, []);
    });
  });

  describe('8. Calendar Navigation & Date Math', () => {
    it('calculates 7-day week bounds correctly', () => {
      // Test reference date: Friday, Sept 4, 2026
      const refDate = new Date('2026-09-04T12:00:00Z');
      const dayOfWeek = refDate.getDay(); // 5 = Friday
      const sunday = new Date(refDate);
      sunday.setDate(refDate.getDate() - dayOfWeek);

      const saturday = new Date(sunday);
      saturday.setDate(sunday.getDate() + 6);

      assert.equal(sunday.getDay(), 0); // Sunday
      assert.equal(saturday.getDay(), 6); // Saturday
      assert.equal(formatDateKey(sunday), '2026-08-30');
      assert.equal(formatDateKey(saturday), '2026-09-05');
    });

    it('formats today date key consistently', () => {
      const todayKey = getTodayDateKey();
      assert.match(todayKey, /^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('9. Notifications: Challenge Ending Soon Integration', () => {
    it('routes TEACHER_CHALLENGE_ENDING_SOON notifications to challenges tab with View Challenge', () => {
      const notif: TeacherNotification = {
        id: 'notif-chal-end',
        type: 'TEACHER_CHALLENGE_ENDING_SOON',
        title: 'Class challenge ending soon',
        body: '"September Scripture Challenge" ends tomorrow.',
        payload: {
          challengeId: 'chal-123',
          classroomId: 'class-wed',
        },
        createdAt: new Date().toISOString(),
        readAt: null,
      };

      const dest = teacherNotificationDestination(notif);
      assert.ok(dest);
      assert.equal(dest?.page, 'challenges');
      assert.equal(dest?.challengeId, 'chal-123');
      assert.equal(dest?.actionLabel, 'View Challenge');
      assert.equal(TEACHER_NOTIFICATION_ICON.TEACHER_CHALLENGE_ENDING_SOON, '🏆');
      assert.equal(TEACHER_NOTIFICATION_DEFAULT_PRIORITY.TEACHER_CHALLENGE_ENDING_SOON, 'normal');
    });
  });
});
