'use client';

import { useState } from 'react';
import type { ClassroomCard } from '../lib/classrooms/types';
import { useDialogA11y } from '../lib/use-dialog';

export default function CreateAnnouncementModal({
  classrooms,
  initialClassroomId,
  onClose,
  onCreated,
}: {
  classrooms: ClassroomCard[];
  initialClassroomId?: string;
  onClose: () => void;
  onCreated: (count?: number) => void;
}) {
  const dialogRef = useDialogA11y<HTMLDivElement>(true, onClose);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [classroomId, setClassroomId] = useState(initialClassroomId || (classrooms[0]?.id ?? ''));
  const [eventDate, setEventDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide an announcement title.');
      return;
    }
    if (!message.trim()) {
      setError('Please provide a message.');
      return;
    }
    if (!classroomId) {
      setError('Please select a target classroom.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const res = await fetch('/api/teacher/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId,
          title: title.trim(),
          message: message.trim(),
          eventDate: eventDate || null,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { deliveredCount?: number; error?: string };
      if (res.ok) {
        onCreated(data.deliveredCount);
        onClose();
      } else {
        setError(data.error || 'Could not send announcement.');
      }
    } catch {
      setError('Network error sending announcement.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="teacher-modal-overlay" onClick={onClose}>
      <div ref={dialogRef} className="teacher-modal-card teacher-announcement-modal" role="dialog" aria-modal="true" aria-labelledby="announcement-modal-title" onClick={(e) => e.stopPropagation()}>
        <div className="teacher-modal-header">
          <div>
            <span className="teacher-kicker">Communication</span>
            <h2 id="announcement-modal-title">Post Classroom Announcement</h2>
          </div>
          <button type="button" className="teacher-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="teacher-modal-form">
          {error && <div className="teacher-access-error">{error}</div>}

          <div className="teacher-safe-comms-note">
            <span aria-hidden="true">🛡️</span>
            <div>
              <strong>Safe Classroom Communication</strong>
              <p>This structured announcement delivers directly to approved students in this classroom. It is read-only and does not open public or direct chat channels.</p>
            </div>
          </div>

          <label>
            Target Classroom *
            <select value={classroomId} onChange={(e) => setClassroomId(e.target.value)} required>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Announcement Title *
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Remember to complete this week's Bible reading"
              required
              maxLength={120}
            />
          </label>

          <label>
            Message *
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your classroom message here. Example: Don't forget to review Psalm 23 before Sunday School this week!"
              rows={4}
              required
              maxLength={2000}
            />
          </label>

          <label>
            Associated Date/Time (Optional)
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </label>

          <div className="teacher-modal-actions">
            <button type="button" className="button button-secondary" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="button button-primary" disabled={busy}>
              {busy ? 'Delivering…' : 'Post Announcement 📣'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
