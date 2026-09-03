'use client';

import { useEffect, useState } from 'react';
import type { TeacherNotificationPreferences } from '../lib/teacher-notifications/server';
import { useDialogA11y } from '../lib/use-dialog';

export default function NotificationPreferencesModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved?: () => void;
}) {
  const dialogRef = useDialogA11y<HTMLDivElement>(true, onClose);
  const [prefs, setPrefs] = useState<TeacherNotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/teacher/notification-preferences')
      .then((res) => (res.ok ? res.json() as Promise<{ preferences: TeacherNotificationPreferences }> : Promise.reject()))
      .then((data) => {
        setPrefs(data.preferences);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load preferences — check your connection.');
        setLoading(false);
      });
  }, []);

  async function handleSave() {
    if (!prefs) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/teacher/notification-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      if (res.ok) {
        if (onSaved) onSaved();
        onClose();
      } else {
        setError('Could not save preferences. Please try again.');
      }
    } catch {
      setError('Network error saving preferences.');
    } finally {
      setSaving(false);
    }
  }

  function toggle(key: keyof TeacherNotificationPreferences) {
    if (!prefs) return;
    setPrefs({ ...prefs, [key]: !prefs[key] });
  }

  return (
    <div className="teacher-modal-overlay" onClick={onClose}>
      <div ref={dialogRef} className="teacher-modal-card teacher-pref-modal" role="dialog" aria-modal="true" aria-labelledby="pref-modal-title" onClick={(e) => e.stopPropagation()}>
        <div className="teacher-modal-header">
          <div>
            <span className="teacher-kicker">Preferences</span>
            <h2 id="pref-modal-title">Notification Settings</h2>
          </div>
          <button type="button" className="teacher-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <p className="teacher-modal-desc">
          Choose which notifications you receive in your dashboard. Notifications help keep you informed of student progress and time-sensitive milestones.
        </p>

        {loading ? (
          <div className="teacher-pref-loading">Loading preferences…</div>
        ) : (
          <div className="teacher-pref-list">
            {error && <div className="teacher-pref-error">{error}</div>}

            {/* Essential security notice - mandatory */}
            <div className="teacher-pref-item locked">
              <div className="teacher-pref-info">
                <strong>Account &amp; Security Alerts 🔒</strong>
                <small>Essential system and safety notices required for classroom compliance.</small>
              </div>
              <label className="teacher-switch disabled">
                <input type="checkbox" checked={true} disabled aria-label="Security alerts (always active)" />
                <span className="teacher-slider" />
              </label>
            </div>

            {/* Submissions */}
            <div className="teacher-pref-item">
              <div className="teacher-pref-info">
                <strong>Student Assignment Submissions</strong>
                <small>Notify me when a student submits work ready for review.</small>
              </div>
              <label className="teacher-switch">
                <input
                  type="checkbox"
                  checked={prefs?.assignment_submissions ?? true}
                  onChange={() => toggle('assignment_submissions')}
                  aria-label="Assignment submissions"
                />
                <span className="teacher-slider" />
              </label>
            </div>

            {/* Grading reminders */}
            <div className="teacher-pref-item">
              <div className="teacher-pref-info">
                <strong>Pending Grading Reminders</strong>
                <small>Alert me when assignments are awaiting feedback or grading.</small>
              </div>
              <label className="teacher-switch">
                <input
                  type="checkbox"
                  checked={prefs?.grading_reminders ?? true}
                  onChange={() => toggle('grading_reminders')}
                  aria-label="Pending grading reminders"
                />
                <span className="teacher-slider" />
              </label>
            </div>

            {/* Challenge updates */}
            <div className="teacher-pref-item">
              <div className="teacher-pref-info">
                <strong>Class Challenge Milestones</strong>
                <small>Notify me when class challenges near completion or achieve their goal.</small>
              </div>
              <label className="teacher-switch">
                <input
                  type="checkbox"
                  checked={prefs?.challenge_updates ?? true}
                  onChange={() => toggle('challenge_updates')}
                  aria-label="Class challenge milestones"
                />
                <span className="teacher-slider" />
              </label>
            </div>

            {/* Inactivity alerts */}
            <div className="teacher-pref-item">
              <div className="teacher-pref-info">
                <strong>Student Attention &amp; Inactivity</strong>
                <small>Alert me when a student has been inactive for 5+ days or needs help.</small>
              </div>
              <label className="teacher-switch">
                <input
                  type="checkbox"
                  checked={prefs?.student_inactivity_alerts ?? true}
                  onChange={() => toggle('student_inactivity_alerts')}
                  aria-label="Student attention alerts"
                />
                <span className="teacher-slider" />
              </label>
            </div>

            {/* Deadlines */}
            <div className="teacher-pref-item">
              <div className="teacher-pref-info">
                <strong>Approaching Assignment Deadlines</strong>
                <small>Notify me 24–48 hours before an assignment due date.</small>
              </div>
              <label className="teacher-switch">
                <input
                  type="checkbox"
                  checked={prefs?.upcoming_deadlines ?? true}
                  onChange={() => toggle('upcoming_deadlines')}
                  aria-label="Approaching deadlines"
                />
                <span className="teacher-slider" />
              </label>
            </div>

            {/* Events */}
            <div className="teacher-pref-item">
              <div className="teacher-pref-info">
                <strong>Upcoming Classroom Events</strong>
                <small>Remind me on the day of and day before a scheduled classroom event.</small>
              </div>
              <label className="teacher-switch">
                <input
                  type="checkbox"
                  checked={prefs?.upcoming_events ?? true}
                  onChange={() => toggle('upcoming_events')}
                  aria-label="Upcoming classroom events"
                />
                <span className="teacher-slider" />
              </label>
            </div>
          </div>
        )}

        <div className="teacher-modal-actions">
          <button type="button" className="button button-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="button button-primary" onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving…' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
