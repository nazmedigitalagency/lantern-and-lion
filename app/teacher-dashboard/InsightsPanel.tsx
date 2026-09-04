'use client';

import { useEffect, useState } from 'react';
import type { AttentionEntry, ClassInsight, ClassInsightsResponse, ImprovingEntry, SuggestedAssignment, TopicInsight } from '../lib/insights/types';
import CreateAssignmentModal, { type AssignmentTemplatePrefill } from './CreateAssignmentModal';
import StudentDetailModal from './StudentDetailModal';

function toPrefill(s: SuggestedAssignment): AssignmentTemplatePrefill {
  return { title: s.title, instructions: s.instructions, assignmentType: s.assignmentType, referenceId: s.referenceId, timeLimitMinutes: null, requiredScore: null, xpReward: null, ageGroup: s.ageGroup };
}

export default function InsightsPanel({ onSelectStudent }: { onSelectStudent?: (studentId: string) => void }) {
  const [data, setData] = useState<ClassInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [classroomId, setClassroomId] = useState('');
  const [assignPrefill, setAssignPrefill] = useState<AssignmentTemplatePrefill | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  function refresh(id: string) {
    setLoading(true);
    setError('');
    const qs = id ? `?classroomId=${id}` : '';
    fetch(`/api/teacher/insights${qs}`)
      .then((res) => (res.ok ? (res.json() as Promise<ClassInsightsResponse>) : Promise.reject()))
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError('Could not load insights — check your connection and try again.'); setLoading(false); });
  }

  useEffect(() => {
    let active = true;
    fetch('/api/teacher/insights')
      .then((res) => (res.ok ? (res.json() as Promise<ClassInsightsResponse>) : Promise.reject()))
      .then((d) => {
        if (active) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError('Could not load insights — check your connection and try again.');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const classroomOptions = data?.classrooms || [];

  if (loading) {
    return (
      <div className="teacher-students-loading">
        <span></span>
        <p>Looking at your class&apos;s learning data…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="teacher-empty">
        <span>!</span>
        <div><strong>{error || 'Could not load insights.'}</strong></div>
      </div>
    );
  }

  if (data.scope.studentCount === 0) {
    return (
      <div className="teacher-empty teacher-empty-students">
        <span>💡</span>
        <div>
          <strong>No students to show insights for yet.</strong>
          <p>Once students join a classroom and start learning, you’ll see class strengths, areas to practice, and recommendations here.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {classroomOptions.length > 1 && (
        <div className="insights-classroom-filter">
          <label>
            Classroom
            <select
              value={classroomId}
              onChange={(e) => { setClassroomId(e.target.value); refresh(e.target.value); }}
            >
              <option value="">All classes</option>
              {classroomOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>
      )}

      <section className="insights-section">
        <h2>Class Overview</h2>
        {data.overview.length === 0 ? (
          <p className="student-detail-empty">Not enough activity yet to show class-level numbers — check back once students have started learning.</p>
        ) : (
          <div className="insights-overview-grid">
            {data.overview.map((m) => (
              <div key={m.key} className="insights-metric-card">
                <span className="insights-metric-emoji">{m.emoji}</span>
                <strong>{m.value}%</strong>
                <span className="insights-metric-label">{m.label}</span>
                <small>{m.sampleSize} {m.sampleUnit}</small>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="insights-two-col">
        <section className="insights-section">
          <h2>Class Strengths</h2>
          {data.strengths.length === 0 ? (
            <p className="student-detail-empty">No clear class-wide strength yet — check back as more work comes in.</p>
          ) : (
            <ul className="insights-card-list">
              {data.strengths.map((c) => <InsightCardRow key={c.id} card={c} onCreateAssignment={setAssignPrefill} />)}
            </ul>
          )}
        </section>

        <section className="insights-section">
          <h2>Areas to Practice</h2>
          {data.areasToPractice.length === 0 ? (
            <p className="student-detail-empty">Nothing stands out as a common weak spot right now — nice work.</p>
          ) : (
            <ul className="insights-card-list">
              {data.areasToPractice.map((c) => <InsightCardRow key={c.id} card={c} onCreateAssignment={setAssignPrefill} />)}
            </ul>
          )}
        </section>
      </div>

      <section className="insights-section">
        <h2>Topics</h2>
        <div className="insights-topics-grid">
          <TopicColumn title="Strong Topics" emoji="💪" topics={data.topics.strong} empty="No topic has enough data yet." />
          <TopicColumn title="Needs Practice" emoji="📌" topics={data.topics.needsPractice} empty="Nothing is standing out as weak right now." />
          <TopicColumn title="Recently Improved" emoji="📈" topics={data.topics.recentlyImproved} empty="No recent improvement streaks yet." />
        </div>
      </section>

      <div className="insights-two-col">
        <section className="insights-section">
          <h2>🚨 Needs Attention</h2>
          <p className="insights-attention-subhead">Students who may benefit from a quick check-in — based on real activity, not a diagnosis.</p>
          {data.needsAttention.length === 0 ? (
            <p className="student-detail-empty">No one needs attention right now — nice work!</p>
          ) : (
            <ul className="insights-attention-list">
              {data.needsAttention.map((a) => <AttentionRow key={a.studentId} entry={a} onSelect={onSelectStudent || setSelectedStudentId} />)}
            </ul>
          )}
        </section>

        <section className="insights-section">
          <h2>Making Great Progress</h2>
          {data.improving.length === 0 ? (
            <p className="student-detail-empty">Not enough history yet to show improvement trends.</p>
          ) : (
            <ul className="insights-progress-list">
              {data.improving.map((p) => <ProgressRow key={p.studentId} entry={p} onSelect={onSelectStudent || setSelectedStudentId} />)}
            </ul>
          )}
        </section>
      </div>

      {assignPrefill && (
        <CreateAssignmentModal initialTemplate={assignPrefill} onClose={() => setAssignPrefill(null)} onCreated={() => {}} />
      )}
      {!onSelectStudent && selectedStudentId && (
        <StudentDetailModal studentId={selectedStudentId} onClose={() => setSelectedStudentId(null)} onRemoved={() => refresh(classroomId)} />
      )}
    </>
  );
}

function InsightCardRow({ card, onCreateAssignment }: { card: ClassInsight; onCreateAssignment: (p: AssignmentTemplatePrefill) => void }) {
  return (
    <li className={`insights-card insights-card-${card.tone}`}>
      <span className="insights-card-emoji">{card.emoji}</span>
      <div className="insights-card-body">
        <strong>{card.headline}</strong>
        {card.detail && <p>{card.detail}</p>}
      </div>
      {card.action?.suggestedAssignment && (
        <button type="button" onClick={() => onCreateAssignment(toPrefill(card.action!.suggestedAssignment!))}>{card.action.label}</button>
      )}
    </li>
  );
}

function TopicColumn({ title, emoji, topics, empty }: { title: string; emoji: string; topics: TopicInsight[]; empty: string }) {
  return (
    <div className="insights-topic-column">
      <p className="insights-topic-title">{emoji} {title}</p>
      {topics.length === 0 ? (
        <p className="student-detail-empty">{empty}</p>
      ) : (
        <ul>
          {topics.map((t) => (
            <li key={t.conceptId}>
              <span>{t.label}</span>
              <b>{t.avgMastery}%</b>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const PRIORITY_LABEL: Record<AttentionEntry['priority'], string> = { high: 'High', medium: 'Medium', low: 'Low' };

function AttentionRow({ entry, onSelect }: { entry: AttentionEntry; onSelect: (id: string) => void }) {
  return (
    <li className={`insights-attention-row insights-attention-${entry.priority}`}>
      <div className="insights-attention-row-head">
        <span className={`insights-priority-badge insights-priority-${entry.priority}`}>{PRIORITY_LABEL[entry.priority]}</span>
        <strong>{entry.name}</strong>
        {entry.lastActiveAt && (
          <span className="insights-attention-asof">Last active {new Date(entry.lastActiveAt).toLocaleDateString()}</span>
        )}
      </div>
      <ul>
        {entry.reasons.map((r, i) => <li key={i}>{r}</li>)}
      </ul>
      <button type="button" className="insights-attention-view-btn" onClick={() => onSelect(entry.studentId)}>View Student</button>
    </li>
  );
}

function ProgressRow({ entry, onSelect }: { entry: ImprovingEntry; onSelect: (id: string) => void }) {
  return (
    <li className="insights-progress-row" onClick={() => onSelect(entry.studentId)}>
      <strong>{entry.name}</strong>
      <p>{entry.detail}</p>
    </li>
  );
}
