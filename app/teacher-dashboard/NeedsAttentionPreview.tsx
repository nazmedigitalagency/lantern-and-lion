'use client';

import { useEffect, useState } from 'react';
import type { AttentionEntry, ClassInsightsResponse } from '../lib/insights/types';
import { ATTENTION_THRESHOLDS } from '../lib/attention/config';
import StudentDetailModal from './StudentDetailModal';

const PRIORITY_LABEL: Record<AttentionEntry['priority'], string> = { high: 'High', medium: 'Medium', low: 'Low' };

/**
 * A compact, prominent "Which students should I check on today?" preview
 * for the Overview page — real signals only (reuses /api/teacher/insights,
 * the same computation the full Insights tab uses), across every classroom
 * this teacher owns, capped and priority-sorted server-side. Supportive
 * framing, never alarming: no red banners, just a clear status badge.
 */
export default function NeedsAttentionPreview({ onViewAll }: { onViewAll: () => void }) {
  const [data, setData] = useState<ClassInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/teacher/insights')
      .then((res) => (res.ok ? (res.json() as Promise<ClassInsightsResponse>) : null))
      .then((d) => {
        if (alive) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (loading || !data) return null;

  const preview = data.needsAttention.slice(0, ATTENTION_THRESHOLDS.MAX_ATTENTION_PREVIEW);

  return (
    <section className="teacher-panel attention-preview-panel">
      <div className="teacher-panel-head">
        <div>
          <p className="teacher-kicker">🚨 Needs Attention</p>
          <h2>Which students should I check on today?</h2>
        </div>
        {data.needsAttention.length > 0 && (
          <button type="button" className="attention-preview-viewall" onClick={onViewAll}>
            View all ({data.needsAttention.length}) →
          </button>
        )}
      </div>

      {preview.length === 0 ? (
        <p className="student-detail-empty">No one needs attention right now — nice work!</p>
      ) : (
        <ul className="attention-preview-list">
          {preview.map((entry) => (
            <li key={entry.studentId} className={`attention-preview-row insights-attention-${entry.priority}`}>
              <span className={`insights-priority-badge insights-priority-${entry.priority}`}>{PRIORITY_LABEL[entry.priority]}</span>
              <div className="attention-preview-body">
                <strong>{entry.name}</strong>
                <p>{entry.reasons[0]}</p>
              </div>
              <button type="button" className="insights-attention-view-btn" onClick={() => setSelectedStudentId(entry.studentId)}>
                View Student
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedStudentId && (
        <StudentDetailModal studentId={selectedStudentId} onClose={() => setSelectedStudentId(null)} />
      )}
    </section>
  );
}
