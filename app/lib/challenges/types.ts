export type ChallengeGoalType = 'activities' | 'stories' | 'lessons' | 'xp';
export type ChallengeRewardType = 'xp' | 'none';
export type ChallengeStatus = 'active' | 'completed' | 'expired' | 'cancelled';

/** Every option here maps to a real, already-tracked column — nothing invented. */
export const GOAL_TYPE_LABEL: Record<ChallengeGoalType, string> = {
  activities: 'Bible Activities Completed',
  stories: 'Bible Stories Completed',
  lessons: 'Quizzes & Lessons Completed',
  xp: 'Class XP Earned',
};

export const GOAL_TYPE_UNIT: Record<ChallengeGoalType, string> = {
  activities: 'activities',
  stories: 'stories',
  lessons: 'quizzes/lessons',
  xp: 'XP',
};

export type ChallengeParticipant = { studentId: string; name: string; contribution: number };

export type ClassChallengeSummary = {
  id: string;
  classroomId: string;
  classroomName: string;
  name: string;
  description: string | null;
  goalType: ChallengeGoalType;
  goalTarget: number;
  startDate: string;
  endDate: string;
  rewardType: ChallengeRewardType;
  rewardAmount: number;
  status: ChallengeStatus;
  progress: number;
  percentComplete: number;
  remaining: number;
  /** null once the challenge has ended (completed/expired). */
  daysRemaining: number | null;
  participantsCount: number;
  totalStudents: number;
  topParticipants: ChallengeParticipant[];
};

export type TeacherChallengesResponse = { challenges: ClassChallengeSummary[] };

export type StudentChallengeView = {
  id: string;
  name: string;
  description: string | null;
  classroomName: string;
  goalType: ChallengeGoalType;
  goalTarget: number;
  progress: number;
  percentComplete: number;
  myContribution: number;
  status: ChallengeStatus;
  endDate: string;
  daysRemaining: number | null;
  rewardType: ChallengeRewardType;
  rewardAmount: number;
};

export type StudentChallengesResponse = { challenges: StudentChallengeView[] };
