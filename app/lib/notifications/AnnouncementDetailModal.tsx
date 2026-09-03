'use client';

import { useEffect } from 'react';

export type AnnouncementData = {
  title: string;
  message: string;
  classroomName?: string;
  teacherName?: string;
  eventDate?: string | null;
  createdAt?: string;
};

export function AnnouncementDetailModal({
  announcement,
  onClose,
  tone = 'child',
}: {
  announcement: AnnouncementData;
  onClose: () => void;
  tone?: 'child' | 'teen';
}) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const teacher = announcement.teacherName || 'Your Teacher';
  const classroom = announcement.classroomName || 'Your Class';

  return (
    <div className={`announcement-modal-overlay tone-${tone}`} role="dialog" aria-modal="true" aria-labelledby="announcement-title">
      <div className="announcement-modal-card">
        <div className="announcement-modal-header">
          <div className="announcement-header-icon" aria-hidden="true">📣</div>
          <div className="announcement-header-text">
            <span className="announcement-kicker">Classroom Announcement</span>
            <small>{classroom} · From {teacher}</small>
          </div>
          <button type="button" className="announcement-close-btn" onClick={onClose} aria-label="Close announcement">✕</button>
        </div>

        <div className="announcement-modal-body">
          <h2 id="announcement-title" className="announcement-heading">{announcement.title}</h2>
          <div className="announcement-message-text">{announcement.message}</div>

          {announcement.eventDate && (
            <div className="announcement-date-badge">
              <span aria-hidden="true">📅</span>
              <span>Event Date: <strong>{new Date(announcement.eventDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</strong></span>
            </div>
          )}
        </div>

        <div className="announcement-modal-footer">
          <button type="button" className="button button-primary announcement-ack-btn" onClick={onClose}>
            Got it! 👍
          </button>
        </div>
      </div>
    </div>
  );
}
