'use client';

import { useMemo, useState } from 'react';
import { useStudentAssignments } from './useStudentAssignments';
import { ASSIGNMENT_TYPE_LABEL, type StudentAssignment } from './types';
import { AssignmentDetailModal } from './AssignmentDetailModal';

type TeacherFeedbackHistoryProps = {
  tone: 'child' | 'teen';
  onOpenAssignment?: (assignment: StudentAssignment) => void;
};

const CHILD_DEMO_FEEDBACK: StudentAssignment[] = [
  {
    id: 'demo-quiz-1',
    title: 'Weekly Bible Quiz',
    instructions: 'Test your knowledge on David and Goliath from 1 Samuel 17.',
    assignmentType: 'quiz',
    referenceLabel: 'David and Goliath',
    contentLink: '/arcade/lightning-quiz',
    classroomName: 'Wednesday Explorers',
    teacherName: 'Ms. Sarah',
    dueDate: '2026-09-02',
    timeLimitMinutes: 15,
    requiredScore: 80,
    xpReward: 50,
    status: 'graded',
    score: 92,
    feedback: 'Great work! You remembered the story really well.',
    submittedAt: '2026-09-02T14:30:00Z',
    gradedAt: '2026-09-02T16:00:00Z',
    dueBucket: 'completed',
  },
  {
    id: 'demo-memory-1',
    title: 'Scripture Memory — Psalm 119:105',
    instructions: 'Recite Psalm 119:105: "Your word is a lamp to my feet and a light to my path."',
    assignmentType: 'memory',
    referenceLabel: 'Psalm 119:105',
    contentLink: '/arcade/verse-builder',
    classroomName: 'Wednesday Explorers',
    teacherName: 'Ms. Sarah',
    dueDate: '2026-08-30',
    timeLimitMinutes: null,
    requiredScore: 80,
    xpReward: 35,
    status: 'graded',
    score: 85,
    feedback: 'Wonderful recitation! Keep practicing verse 106 for next week.',
    submittedAt: '2026-08-30T11:00:00Z',
    gradedAt: '2026-08-30T15:30:00Z',
    dueBucket: 'completed',
  },
];

const TEEN_DEMO_FEEDBACK: StudentAssignment[] = [
  {
    id: 'demo-recall-1',
    title: 'Scripture Recall — Romans 8',
    instructions: 'Examine Romans 8:31-39 and reflect on God’s enduring love in Christ Jesus.',
    assignmentType: 'quiz',
    referenceLabel: 'Romans 8',
    contentLink: '/curriculum/teen-romans-eight',
    classroomName: 'Friday Teen Circle',
    teacherName: 'Mr. Davis',
    dueDate: '2026-09-02',
    timeLimitMinutes: 20,
    requiredScore: 85,
    xpReward: 75,
    status: 'graded',
    score: 92,
    feedback: 'Strong work on the Scripture recall section. Review verse 4 once more.',
    submittedAt: '2026-09-02T17:15:00Z',
    gradedAt: '2026-09-02T19:00:00Z',
    dueBucket: 'completed',
  },
  {
    id: 'demo-outreach-1',
    title: 'Youth Outreach & Service Reflection',
    instructions: 'Write a short reflection on servant leadership and how faith informs your daily actions.',
    assignmentType: 'written',
    referenceLabel: 'Servant Leadership',
    contentLink: null,
    classroomName: 'Friday Teen Circle',
    teacherName: 'Mr. Davis',
    dueDate: '2026-08-28',
    timeLimitMinutes: null,
    requiredScore: 80,
    xpReward: 60,
    status: 'graded',
    score: 94,
    feedback: 'Thoughtful perspective on servant leadership and community action. Well articulated.',
    submittedAt: '2026-08-28T19:40:00Z',
    gradedAt: '2026-08-29T10:15:00Z',
    dueBucket: 'completed',
  },
];

export function TeacherFeedbackHistory({ tone, onOpenAssignment }: TeacherFeedbackHistoryProps) {
  const { assignments, reload } = useStudentAssignments();
  const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignment | null>(null);

  // Completed or returned assignments that have teacher feedback
  const feedbackItems = useMemo(() => {
    const liveItems = (assignments || []).filter(
      (a) => (a.status === 'graded' || a.status === 'returned' || a.dueBucket === 'completed') && a.feedback && a.feedback.trim().length > 0
    );

    if (liveItems.length > 0) return liveItems;

    // In demo/offline mode, supply the appropriate baseline demo items
    return tone === 'teen' ? TEEN_DEMO_FEEDBACK : CHILD_DEMO_FEEDBACK;
  }, [assignments, tone]);

  function handleOpen(item: StudentAssignment) {
    if (onOpenAssignment) {
      onOpenAssignment(item);
    } else {
      setSelectedAssignment(item);
    }
  }

  return (
    <div className={`teacher-feedback-history feedback-history-${tone}`}>
      <div className="feedback-history-header">
        <div className="feedback-history-title-wrap">
          <span className="feedback-history-badge" aria-hidden="true">
            {tone === 'teen' ? '📋' : '💬'}
          </span>
          <div>
            <h3>{tone === 'teen' ? 'Teacher Feedback' : '💬 Teacher Feedback'}</h3>
            <p className="feedback-history-subtitle">
              {tone === 'teen'
                ? 'Guidance, reviews, and notes attached to your completed coursework.'
                : 'Encouraging notes and tips from your teachers on your assignments!'}
            </p>
          </div>
        </div>
        <span className="feedback-privacy-pill">
          🔒 Educational feedback attached to coursework
        </span>
      </div>

      {feedbackItems.length === 0 ? (
        <div className="feedback-empty-state">
          <span className="feedback-empty-icon" aria-hidden="true">✨</span>
          <h4>No teacher feedback yet</h4>
          <p>
            {tone === 'teen'
              ? 'As your instructors review and grade your coursework, their feedback will appear here.'
              : 'Complete your assignments and your teacher will leave encouraging notes here!'}
          </p>
        </div>
      ) : (
        <div className="feedback-history-list">
          {feedbackItems.map((item) => (
            <div key={item.id} className={`feedback-history-card feedback-card-${tone}`}>
              {tone === 'child' ? (
                /* CHILD UI: Simple, friendly speech bubble */
                <div className="child-feedback-layout">
                  <div className="child-feedback-top">
                    <div className="child-feedback-kicker">
                      <span className="child-avatar" aria-hidden="true">👩‍🏫</span>
                      <strong>{item.teacherName || 'Ms. Sarah'} says...</strong>
                    </div>
                    {item.score !== null && (
                      <span className="child-score-badge">⭐ {item.score}%</span>
                    )}
                  </div>

                  <div className="child-speech-bubble-body">
                    <p className="child-bubble-text">&ldquo;{item.feedback}&rdquo;</p>
                  </div>

                  <div className="child-feedback-assignment-bar">
                    <div className="child-assignment-info">
                      <span className="child-assignment-type-tag">
                        {ASSIGNMENT_TYPE_LABEL[item.assignmentType] || 'Assignment'}
                      </span>
                      <span className="child-assignment-name">{item.title}</span>
                      {item.classroomName && (
                        <span className="child-class-name">({item.classroomName})</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="child-view-assignment-btn"
                      onClick={() => handleOpen(item)}
                      aria-label={`View assignment ${item.title}`}
                    >
                      [View Assignment]
                    </button>
                  </div>
                </div>
              ) : (
                /* TEEN UI: Mature, constructive card */
                <div className="teen-feedback-layout">
                  <div className="teen-feedback-top">
                    <div className="teen-feedback-meta">
                      <span className="teen-feedback-tag">Teacher feedback</span>
                      <span className="teen-feedback-author">
                        {item.teacherName || 'Instructor'} {item.classroomName ? `• ${item.classroomName}` : ''}
                      </span>
                    </div>
                    {item.score !== null && (
                      <span className="teen-score-pill">Score: {item.score}%</span>
                    )}
                  </div>

                  <div className="teen-feedback-quote">
                    <p>&ldquo;{item.feedback}&rdquo;</p>
                  </div>

                  <div className="teen-feedback-footer">
                    <div className="teen-asgn-ref">
                      <span className="teen-asgn-type">{ASSIGNMENT_TYPE_LABEL[item.assignmentType]}</span>
                      <strong className="teen-asgn-title">{item.title}</strong>
                    </div>
                    <button
                      type="button"
                      className="teen-view-assignment-btn"
                      onClick={() => handleOpen(item)}
                      aria-label={`View assignment ${item.title}`}
                    >
                      [View Assignment]
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedAssignment && (
        <AssignmentDetailModal
          assignment={selectedAssignment}
          tone={tone}
          onClose={() => setSelectedAssignment(null)}
          onChanged={() => {
            setSelectedAssignment(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
