// Shared types for the Teacher Dashboard's "My Students" feature.
// Used by both the teacher/students API routes and their client components,
// so the roster list and the student detail view never drift apart.

export type AgeGroup = 'child' | 'teen';
export type ActivityStatus = 'active' | 'recently_active' | 'inactive';

export type StudentClassroomRef = { id: string; name: string };
export type StudentConceptRef = { conceptId: string; label: string; masteryScore: number };

export type StudentCard = {
  id: string;
  name: string;
  age: number;
  ageGroup: AgeGroup;
  classrooms: StudentClassroomRef[];
  xp: number;
  level: number;
  levelTitle: string;
  currentStreak: number;
  weeklyActiveDays: number;
  masteryPercent: number;
  masteryTracked: boolean;
  lastActiveAt: string | null;
  activityStatus: ActivityStatus;
  needsHelp: boolean;
  needsAttention: boolean;
  needsAttentionReasons: string[];
};

export type PendingStudent = {
  id: string;
  name: string;
  classrooms: StudentClassroomRef[];
  joinedAt: string | null;
};

export type StudentsRosterResponse = {
  classrooms: { id: string; name: string; ageBand: string | null }[];
  students: StudentCard[];
  pending: PendingStudent[];
};

export type StudentActivityKind = 'daily' | 'story' | 'achievement' | 'streak';
export type StudentActivityItem = {
  id: string;
  occurredAt: string;
  label: string;
  kind: StudentActivityKind;
};

export type StudentStreakCalendarDay = { date: string; state: 'complete' | 'grace' | 'pending' | 'none' };

export type StudentDetailResponse = {
  student: StudentCard;
  longestStreak: number;
  graceDays: number;
  weekCalendar: StudentStreakCalendarDay[];
  learning: {
    strengths: StudentConceptRef[];
    needsPractice: StudentConceptRef[];
    dueReviewCount: number;
    conceptsTracked: number;
  };
  stories: { storyId: string; title: string; completedAt: string | null }[];
  recentActivity: StudentActivityItem[];
};

// "Add Student with Teacher Code" — the two-step lookup-then-request flow.

export type ConnectionState = 'none' | 'pending' | 'approved';

/** Deliberately thin — no age, username, or family info before a request exists. */
export type StudentLookupPreview = { id: string; name: string; ageGroup: AgeGroup; avatar: string };

export type StudentLookupResponse = {
  student: StudentLookupPreview;
  classroom: StudentClassroomRef;
  connection: ConnectionState;
};

export type AddStudentResponse = {
  success: true;
  pendingApproval: true;
  child: { id: string; name: string };
  classroom: StudentClassroomRef;
};

export type AddStudentErrorResponse = {
  error: string;
  status?: 'not_found' | 'already_connected' | 'pending';
};
