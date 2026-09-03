'use client';

import { useState } from 'react';
import type { ClassroomCard } from '../lib/classrooms/types';
import { useDialogA11y } from '../lib/use-dialog';

export default function CreateEventModal({
  classrooms,
  initialClassroomId,
  initialDate,
  onClose,
  onCreated,
}: {
  classrooms: ClassroomCard[];
  initialClassroomId?: string;
  initialDate?: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const dialogRef = useDialogA11y<HTMLDivElement>(true, onClose);
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<'sunday_school' | 'bible_study' | 'youth_meeting' | 'scripture_challenge' | 'review' | 'other'>('sunday_school');
  const [classroomId, setClassroomId] = useState(initialClassroomId || (classrooms[0]?.id ?? ''));
  const [eventDate, setEventDate] = useState(initialDate || new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide an event title.');
      return;
    }
    if (!classroomId) {
      setError('Please select a classroom.');
      return;
    }
    if (!eventDate) {
      setError('Please provide an event date.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const res = await fetch('/api/teacher/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId,
          title: title.trim(),
          eventType,
          eventDate,
          startTime: startTime || null,
          endTime: endTime || null,
          description: description.trim() || null,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        onCreated();
        onClose();
      } else {
        setError(data.error || 'Could not schedule event.');
      }
    } catch {
      setError('Network error scheduling event.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="teacher-modal-overlay" onClick={onClose}>
      <div ref={dialogRef} className="teacher-modal-card teacher-event-modal" role="dialog" aria-modal="true" aria-labelledby="create-event-title" onClick={(e) => e.stopPropagation()}>
        <div className="teacher-modal-header">
          <div>
            <span className="teacher-kicker">Calendar</span>
            <h2 id="create-event-title">Schedule Classroom Event</h2>
          </div>
          <button type="button" className="teacher-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="teacher-modal-form">
          {error && <div className="teacher-access-error">{error}</div>}

          <label>
            Event Title *
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sunday School Bible Study"
              required
              maxLength={120}
            />
          </label>

          <div className="teacher-form-row">
            <label>
              Event Category *
              <select value={eventType} onChange={(e) => setEventType(e.target.value as typeof eventType)}>
                <option value="sunday_school">Sunday School</option>
                <option value="bible_study">Bible Study</option>
                <option value="youth_meeting">Youth Meeting</option>
                <option value="scripture_challenge">Scripture Challenge</option>
                <option value="review">Review Session</option>
                <option value="other">Other Classroom Event</option>
              </select>
            </label>

            <label>
              Classroom *
              <select value={classroomId} onChange={(e) => setClassroomId(e.target.value)} required>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="teacher-form-row three-col">
            <label>
              Date *
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </label>

            <label>
              Start Time (Optional)
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </label>

            <label>
              End Time (Optional)
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </label>
          </div>

          <label>
            Description &amp; Meeting Notes (Optional)
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Please bring your Bibles! We will explore David and Goliath in 1 Samuel 17."
              rows={3}
              maxLength={1000}
            />
          </label>

          <div className="teacher-modal-actions">
            <button type="button" className="button button-secondary" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="button button-primary" disabled={busy}>
              {busy ? 'Scheduling…' : 'Schedule Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
