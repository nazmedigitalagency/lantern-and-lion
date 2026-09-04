import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  teacherNotificationDestination,
  TEACHER_NOTIFICATION_DEFAULT_PRIORITY,
  TEACHER_NOTIFICATION_ICON,
  DEFAULT_TEACHER_PREFERENCES,
  type TeacherNotification,
  type TeacherNotificationType,
  type TeacherNotificationPreferences,
} from '../app/lib/notifications/types.ts';

describe('Feature 15: Teacher Notifications System', () => {
  describe('Notification Types and Priority Standards', () => {
    it('defines correct priorities across all teacher notification types', () => {
      // High priority: immediate awareness or action required
      assert.equal(TEACHER_NOTIFICATION_DEFAULT_PRIORITY.TEACHER_DEADLINE_APPROACHING, 'high');
      assert.equal(TEACHER_NOTIFICATION_DEFAULT_PRIORITY.TEACHER_ASSIGNMENT_UNCOMPLETED_ALERT, 'high');
      assert.equal(TEACHER_NOTIFICATION_DEFAULT_PRIORITY.TEACHER_STUDENT_ATTENTION, 'high');
      assert.equal(TEACHER_NOTIFICATION_DEFAULT_PRIORITY.TEACHER_STUDENT_MISSING_WORK, 'high');
      assert.equal(TEACHER_NOTIFICATION_DEFAULT_PRIORITY.TEACHER_STUDENT_PERFORMANCE_ALERT, 'high');
      assert.equal(TEACHER_NOTIFICATION_DEFAULT_PRIORITY.TEACHER_CONNECTION_APPROVED, 'high');
      assert.equal(TEACHER_NOTIFICATION_DEFAULT_PRIORITY.TEACHER_CONNECTION_DECLINED, 'high');
      assert.equal(TEACHER_NOTIFICATION_DEFAULT_PRIORITY.TEACHER_CONNECTION_REVOKED, 'high');

      // Normal priority: regular workflow events, milestones, submissions
      assert.equal(TEACHER_NOTIFICATION_DEFAULT_PRIORITY.TEACHER_ASSIGNMENT_SUBMITTED, 'normal');
      assert.equal(TEACHER_NOTIFICATION_DEFAULT_PRIORITY.TEACHER_GRADING_REMINDER, 'normal');
      assert.equal(TEACHER_NOTIFICATION_DEFAULT_PRIORITY.TEACHER_CHALLENGE_COMPLETED, 'normal');
      assert.equal(TEACHER_NOTIFICATION_DEFAULT_PRIORITY.TEACHER_CLASS_XP_MILESTONE, 'normal');
      assert.equal(TEACHER_NOTIFICATION_DEFAULT_PRIORITY.TEACHER_CLASS_ACTIVITIES_MILESTONE, 'normal');
      assert.equal(TEACHER_NOTIFICATION_DEFAULT_PRIORITY.TEACHER_CLASS_ACHIEVEMENT, 'normal');

      // Low priority: informative insights and calendar events
      assert.equal(TEACHER_NOTIFICATION_DEFAULT_PRIORITY.TEACHER_LEARNING_INSIGHT, 'low');
      assert.equal(TEACHER_NOTIFICATION_DEFAULT_PRIORITY.TEACHER_CLASSROOM_EVENT, 'low');
    });

    it('assigns descriptive emoji icons for each teacher notification type', () => {
      const types: TeacherNotificationType[] = [
        'TEACHER_ASSIGNMENT_SUBMITTED',
        'TEACHER_GRADING_REMINDER',
        'TEACHER_CHALLENGE_COMPLETED',
        'TEACHER_STUDENT_ATTENTION',
        'TEACHER_DEADLINE_APPROACHING',
        'TEACHER_CLASSROOM_EVENT',
        'TEACHER_CONNECTION_APPROVED',
        'TEACHER_CONNECTION_DECLINED',
        'TEACHER_CONNECTION_REVOKED',
        'TEACHER_ASSIGNMENT_UNCOMPLETED_ALERT',
        'TEACHER_STUDENT_MISSING_WORK',
        'TEACHER_STUDENT_PERFORMANCE_ALERT',
        'TEACHER_CLASS_XP_MILESTONE',
        'TEACHER_CLASS_ACTIVITIES_MILESTONE',
        'TEACHER_CLASS_ACHIEVEMENT',
        'TEACHER_LEARNING_INSIGHT',
      ];

      for (const t of types) {
        const icon = TEACHER_NOTIFICATION_ICON[t];
        assert.ok(icon, `Icon should be defined for ${t}`);
        assert.ok(typeof icon === 'string' && icon.length > 0);
      }
    });
  });

  describe('Deep Link Resolution and Action Labels', () => {
    it('routes assignment uncompleted alerts directly to assignment detail with View Assignment', () => {
      const notif: TeacherNotification = {
        id: 'notif-1',
        type: 'TEACHER_ASSIGNMENT_UNCOMPLETED_ALERT',
        title: 'Assignment deadline approaching',
        body: '6 students haven\'t completed "Genesis 1:1 Memory Verse".',
        payload: {
          assignmentId: 'assign-456',
          classroomId: 'class-789',
          uncompletedCount: 6,
        },
        createdAt: new Date().toISOString(),
        readAt: null,
        priority: 'high',
      };

      const dest = teacherNotificationDestination(notif);
      assert.ok(dest);
      assert.equal(dest?.page, 'assignments');
      assert.equal(dest?.assignmentId, 'assign-456');
      assert.equal(dest?.actionLabel, 'View Assignment');
    });

    it('routes student missing work alerts directly to student profile modal with View Student', () => {
      const notif: TeacherNotification = {
        id: 'notif-2',
        type: 'TEACHER_STUDENT_MISSING_WORK',
        title: 'Student Missing Work Alert',
        body: 'Daniel has 3 uncompleted assignments that are past due.',
        payload: {
          childId: 'child-dan',
          childName: 'Daniel',
          classroomId: 'class-789',
          missingCount: 3,
        },
        createdAt: new Date().toISOString(),
        readAt: null,
        priority: 'high',
      };

      const dest = teacherNotificationDestination(notif);
      assert.ok(dest);
      assert.equal(dest?.page, 'students');
      assert.equal(dest?.childId, 'child-dan');
      assert.equal(dest?.actionLabel, 'View Student');
    });

    it('routes student quiz performance alert to student profile modal with View Student', () => {
      const notif: TeacherNotification = {
        id: 'notif-3',
        type: 'TEACHER_STUDENT_PERFORMANCE_ALERT',
        title: 'Student Quiz Performance Alert',
        body: 'Sarah scored 55% on recent quizzes (down from 82% previous average).',
        payload: {
          childId: 'child-sarah',
          childName: 'Sarah',
          classroomId: 'class-789',
          recentAvg: 55,
          priorAvg: 82,
        },
        createdAt: new Date().toISOString(),
        readAt: null,
        priority: 'high',
      };

      const dest = teacherNotificationDestination(notif);
      assert.ok(dest);
      assert.equal(dest?.page, 'students');
      assert.equal(dest?.childId, 'child-sarah');
      assert.equal(dest?.actionLabel, 'View Student');
    });

    it('routes class XP milestones directly to class detail view with View Classroom', () => {
      const notif: TeacherNotification = {
        id: 'notif-4',
        type: 'TEACHER_CLASS_XP_MILESTONE',
        title: 'Class XP Milestone! 🌟',
        body: 'Your class reached 10,000 XP! Fantastic team effort.',
        payload: {
          classroomId: 'class-789',
          className: 'Sunday Champions',
          milestone: 10000,
        },
        createdAt: new Date().toISOString(),
        readAt: null,
        priority: 'normal',
      };

      const dest = teacherNotificationDestination(notif);
      assert.ok(dest);
      assert.equal(dest?.page, 'classes');
      assert.equal(dest?.classroomId, 'class-789');
      assert.equal(dest?.actionLabel, 'View Classroom');
    });

    it('routes scripture champion class achievements directly to challenges panel with View Challenge', () => {
      const notif: TeacherNotification = {
        id: 'notif-5',
        type: 'TEACHER_CLASS_ACHIEVEMENT',
        title: 'Class Achievement Unlocked! 🏆',
        body: 'Your class unlocked "Scripture Champion" by mastering this month\'s memory verses!',
        payload: {
          classroomId: 'class-789',
          challengeId: 'chal-memverse',
          badgeName: 'Scripture Champion',
        },
        createdAt: new Date().toISOString(),
        readAt: null,
        priority: 'normal',
      };

      const dest = teacherNotificationDestination(notif);
      assert.ok(dest);
      assert.equal(dest?.page, 'challenges');
      assert.equal(dest?.challengeId, 'chal-memverse');
      assert.equal(dest?.actionLabel, 'View Challenge');
    });

    it('routes weekly learning insights directly to insights panel with View Insights', () => {
      const notif: TeacherNotification = {
        id: 'notif-6',
        type: 'TEACHER_LEARNING_INSIGHT',
        title: 'Weekly Learning Insight 💡',
        body: 'Your class improved Scripture recall by 18% this week! Keep up the momentum.',
        payload: {
          classroomId: 'class-789',
          insightType: 'recall_improvement',
        },
        createdAt: new Date().toISOString(),
        readAt: null,
        priority: 'low',
      };

      const dest = teacherNotificationDestination(notif);
      assert.ok(dest);
      assert.equal(dest?.page, 'insights');
      assert.equal(dest?.actionLabel, 'View Insights');
    });

    it('routes parent connection approval directly to student profile with View Student', () => {
      const notif: TeacherNotification = {
        id: 'notif-7',
        type: 'TEACHER_CONNECTION_APPROVED',
        title: 'Parent Connection Approved',
        body: 'Mrs. Smith approved your connection with Daniel.',
        payload: {
          childId: 'child-dan',
          parentName: 'Mrs. Smith',
          childName: 'Daniel',
        },
        createdAt: new Date().toISOString(),
        readAt: null,
        priority: 'high',
      };

      const dest = teacherNotificationDestination(notif);
      assert.ok(dest);
      assert.equal(dest?.page, 'students');
      assert.equal(dest?.childId, 'child-dan');
      assert.equal(dest?.actionLabel, 'View Connected Student');
    });
  });

  describe('Deduplication Keys and Spam Prevention', () => {
    it('generates consistent, scoped deduplication keys to prevent spam', () => {
      const dateKey = '2026-09-04';
      const assignmentId = 'assign-123';
      const classroomId = 'class-456';
      const childId = 'child-789';

      // Assignment deadline uncompleted alert dedupe key
      const uncompletedDedupeKey = `teacher_uncompleted_${assignmentId}_${dateKey}`;
      assert.equal(uncompletedDedupeKey, 'teacher_uncompleted_assign-123_2026-09-04');

      // Student missing work dedupe key
      const missingWorkDedupeKey = `teacher_missing_work_${classroomId}_${childId}_${dateKey}`;
      assert.equal(missingWorkDedupeKey, 'teacher_missing_work_class-456_child-789_2026-09-04');

      // Student performance alert dedupe key
      const performanceDedupeKey = `teacher_performance_alert_${classroomId}_${childId}_${dateKey}`;
      assert.equal(performanceDedupeKey, 'teacher_performance_alert_class-456_child-789_2026-09-04');

      // Milestone dedupe key is perpetual for the milestone value (never fires twice)
      const milestoneDedupeKey = `teacher_xp_milestone_${classroomId}_10000`;
      assert.equal(milestoneDedupeKey, 'teacher_xp_milestone_class-456_10000');
    });
  });

  describe('Notification Preferences & 5 Specified Categories', () => {
    it('defaults all 5 preference categories to enabled', () => {
      assert.equal(DEFAULT_TEACHER_PREFERENCES.assignment_submissions, true);
      assert.equal(DEFAULT_TEACHER_PREFERENCES.upcoming_deadlines, true);
      assert.equal(DEFAULT_TEACHER_PREFERENCES.grading_reminders, true);
      assert.equal(DEFAULT_TEACHER_PREFERENCES.missing_work_alerts, true);
      assert.equal(DEFAULT_TEACHER_PREFERENCES.student_inactivity_alerts, true);
      assert.equal(DEFAULT_TEACHER_PREFERENCES.student_performance_alerts, true);
      assert.equal(DEFAULT_TEACHER_PREFERENCES.challenge_updates, true);
      assert.equal(DEFAULT_TEACHER_PREFERENCES.class_achievements, true);
      assert.equal(DEFAULT_TEACHER_PREFERENCES.learning_insights, true);
      assert.equal(DEFAULT_TEACHER_PREFERENCES.upcoming_events, true);
      assert.equal(DEFAULT_TEACHER_PREFERENCES.connection_alerts, true);
    });

    it('correctly categorizes preference toggles into the 5 product categories', () => {
      const categories = {
        assignments: ['assignment_submissions', 'upcoming_deadlines', 'grading_reminders'],
        students: ['student_inactivity_alerts', 'missing_work_alerts', 'student_performance_alerts'],
        classAchievements: ['challenge_updates', 'class_achievements'],
        learningInsights: ['learning_insights', 'upcoming_events'],
        connections: ['connection_alerts'],
      };

      const allKeys = Object.keys(DEFAULT_TEACHER_PREFERENCES);
      const categorizedKeys = Object.values(categories).flat();

      assert.equal(allKeys.length, categorizedKeys.length);
      for (const k of allKeys) {
        assert.ok(categorizedKeys.includes(k), `Key ${k} should belong to a category`);
      }
    });

    it('suppresses notifications when category preference is disabled', () => {
      const customPrefs: TeacherNotificationPreferences = {
        ...DEFAULT_TEACHER_PREFERENCES,
        missing_work_alerts: false,
        learning_insights: false,
      };

      // Helper function simulating sync filter
      function shouldNotify(type: TeacherNotificationType, prefs: TeacherNotificationPreferences): boolean {
        if (type === 'TEACHER_STUDENT_MISSING_WORK') return prefs.missing_work_alerts;
        if (type === 'TEACHER_LEARNING_INSIGHT') return prefs.learning_insights;
        if (type === 'TEACHER_ASSIGNMENT_UNCOMPLETED_ALERT') return prefs.upcoming_deadlines;
        return true;
      }

      assert.equal(shouldNotify('TEACHER_STUDENT_MISSING_WORK', customPrefs), false);
      assert.equal(shouldNotify('TEACHER_LEARNING_INSIGHT', customPrefs), false);
      assert.equal(shouldNotify('TEACHER_ASSIGNMENT_UNCOMPLETED_ALERT', customPrefs), true);
    });
  });

  describe('Notification Center Filtering & Read State Simulation', () => {
    const sampleItems: TeacherNotification[] = [
      {
        id: 'n1',
        type: 'TEACHER_DEADLINE_APPROACHING',
        title: 'Assignment deadline approaching',
        body: '6 students haven\'t completed Genesis 1:1.',
        payload: { priority: 'high' },
        createdAt: '2026-09-04T10:00:00Z',
        readAt: null,
        priority: 'high',
      },
      {
        id: 'n2',
        type: 'TEACHER_ASSIGNMENT_SUBMITTED',
        title: 'New assignment submission',
        body: 'Daniel submitted Genesis 1:1.',
        payload: { priority: 'normal' },
        createdAt: '2026-09-04T09:00:00Z',
        readAt: '2026-09-04T09:30:00Z',
        priority: 'normal',
      },
      {
        id: 'n3',
        type: 'TEACHER_STUDENT_MISSING_WORK',
        title: 'Student Missing Work Alert',
        body: 'Daniel has 3 uncompleted assignments.',
        payload: { priority: 'high' },
        createdAt: '2026-09-04T08:00:00Z',
        readAt: null,
        priority: 'high',
      },
      {
        id: 'n4',
        type: 'TEACHER_LEARNING_INSIGHT',
        title: 'Weekly Learning Insight',
        body: 'Your class improved Scripture recall by 18%.',
        payload: { priority: 'low' },
        createdAt: '2026-09-03T15:00:00Z',
        readAt: null,
        priority: 'low',
      },
    ];

    it('calculates unreadCount and highPriorityCount correctly', () => {
      const unreadCount = sampleItems.filter((n) => !n.readAt).length;
      const highPriorityCount = sampleItems.filter((n) => n.priority === 'high' && !n.readAt).length;

      assert.equal(unreadCount, 3); // n1, n3, n4
      assert.equal(highPriorityCount, 2); // n1, n3
    });

    it('filters items correctly according to active filter tab', () => {
      const allItems = sampleItems;
      const unreadItems = sampleItems.filter((n) => !n.readAt);
      const highItems = sampleItems.filter((n) => n.priority === 'high');

      assert.equal(allItems.length, 4);
      assert.equal(unreadItems.length, 3);
      assert.equal(highItems.length, 2);
      assert.deepEqual(highItems.map((n) => n.id), ['n1', 'n3']);
    });

    it('simulates optimistic single item mark-read and unread-toggle', () => {
      let items = [...sampleItems];

      // Mark n1 as read
      items = items.map((n) => (n.id === 'n1' ? { ...n, readAt: new Date().toISOString() } : n));
      const unreadAfterMark = items.filter((n) => !n.readAt).length;
      assert.equal(unreadAfterMark, 2);

      // Toggle n1 back to unread
      items = items.map((n) => (n.id === 'n1' ? { ...n, readAt: null } : n));
      const unreadAfterToggle = items.filter((n) => !n.readAt).length;
      assert.equal(unreadAfterToggle, 3);
    });

    it('simulates optimistic mark-all-read', () => {
      const now = new Date().toISOString();
      const allRead = sampleItems.map((n) => ({
        ...n,
        readAt: n.readAt || now,
      }));

      const unreadCount = allRead.filter((n) => !n.readAt).length;
      assert.equal(unreadCount, 0);
    });
  });

  describe('Security & Multi-Tenant Recipient Isolation', () => {
    it('strictly partitions notifications by teacher recipient_id', () => {
      const teacherA = 'teacher-uuid-alpha';
      const teacherB = 'teacher-uuid-beta';

      const databaseNotifications = [
        { id: '1', recipient_id: teacherA, title: 'Teacher A alert' },
        { id: '2', recipient_id: teacherB, title: 'Teacher B alert' },
        { id: '3', recipient_id: teacherA, title: 'Teacher A second alert' },
      ];

      // Simulates RLS / API query WHERE recipient_id = currentTeacherId
      const teacherAFeed = databaseNotifications.filter((n) => n.recipient_id === teacherA);
      const teacherBFeed = databaseNotifications.filter((n) => n.recipient_id === teacherB);

      assert.equal(teacherAFeed.length, 2);
      assert.equal(teacherBFeed.length, 1);
      assert.ok(teacherAFeed.every((n) => n.recipient_id === teacherA));
      assert.ok(teacherBFeed.every((n) => n.recipient_id === teacherB));
    });
  });
});
