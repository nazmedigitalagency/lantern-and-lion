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
      .then((res) => (res.ok ? (res.json() as Promise<{ preferences: TeacherNotificationPreferences }>) : Promise.reject()))
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
      <div
        ref={dialogRef}
        className="teacher-modal-card teacher-pref-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pref-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="teacher-modal-header">
          <div>
            <span className="teacher-kicker">Settings</span>
            <h2 id="pref-modal-title">Notification Preferences</h2>
          </div>
          <button type="button" className="teacher-modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <p className="teacher-modal-desc">
          Customize which meaningful alerts you receive in your dashboard. Notifications surface events that require awareness or action — never meaningless UI clicks.
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

            {/* Category 1: Assignments */}
            <div className="teacher-pref-category-header">
              <span>📝</span>
              <strong>Assignments</strong>
            </div>

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

            <div className="teacher-pref-item">
              <div className="teacher-pref-info">
                <strong>Approaching Deadlines &amp; Uncompleted Counts</strong>
                <small>Alert me when an assignment is due tomorrow and students haven&apos;t completed it.</small>
              </div>
              <label className="teacher-switch">
                <input
                  type="checkbox"
                  checked={prefs?.upcoming_deadlines ?? true}
                  onChange={() => toggle('upcoming_deadlines')}
                  aria-label="Approaching assignment deadlines"
                />
                <span className="teacher-slider" />
              </label>
            </div>

            <div className="teacher-pref-item">
              <div className="teacher-pref-info">
                <strong>Pending Grading Reminders</strong>
                <small>Alert me when assignments are awaiting feedback or score review.</small>
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

            {/* Category 2: Students */}
            <div className="teacher-pref-category-header">
              <span>👤</span>
              <strong>Students</strong>
            </div>

            <div className="teacher-pref-item">
              <div className="teacher-pref-info">
                <strong>Missing Assignments Alerts</strong>
                <small>Notify me when a student has 3 or more overdue, uncompleted assignments.</small>
              </div>
              <label className="teacher-switch">
                <input
                  type="checkbox"
                  checked={prefs?.missing_work_alerts ?? true}
                  onChange={() => toggle('missing_work_alerts')}
                  aria-label="Missing assignments alerts"
                />
                <span className="teacher-slider" />
              </label>
            </div>

            <div className="teacher-pref-item">
              <div className="teacher-pref-info">
                <strong>Performance Decline Alerts</strong>
                <small>Alert me if a student&apos;s recent quiz scores drop significantly below their average.</small>
              </div>
              <label className="teacher-switch">
                <input
                  type="checkbox"
                  checked={prefs?.student_performance_alerts ?? true}
                  onChange={() => toggle('student_performance_alerts')}
                  aria-label="Student performance decline alerts"
                />
                <span className="teacher-slider" />
              </label>
            </div>

            <div className="teacher-pref-item">
              <div className="teacher-pref-info">
                <strong>Student Inactivity Alerts</strong>
                <small>Alert me when an enrolled student has not logged in for 5 or more days.</small>
              </div>
              <label className="teacher-switch">
                <input
                  type="checkbox"
                  checked={prefs?.student_inactivity_alerts ?? true}
                  onChange={() => toggle('student_inactivity_alerts')}
                  aria-label="Student inactivity alerts"
                />
                <span className="teacher-slider" />
              </label>
            </div>

            {/* Category 3: Class Achievements */}
            <div className="teacher-pref-category-header">
              <span>🏆</span>
              <strong>Class Achievements &amp; Milestones</strong>
            </div>

            <div className="teacher-pref-item">
              <div className="teacher-pref-info">
                <strong>Classroom XP &amp; Activity Milestones</strong>
                <small>Notify me when my class reaches major goals (10,000 XP, 500 Bible activities).</small>
              </div>
              <label className="teacher-switch">
                <input
                  type="checkbox"
                  checked={prefs?.class_achievements ?? true}
                  onChange={() => toggle('class_achievements')}
                  aria-label="Class achievements and milestones"
                />
                <span className="teacher-slider" />
              </label>
            </div>

            <div className="teacher-pref-item">
              <div className="teacher-pref-info">
                <strong>Class Challenge Completions</strong>
                <small>Notify me when a group scripture challenge finishes successfully.</small>
              </div>
              <label className="teacher-switch">
                <input
                  type="checkbox"
                  checked={prefs?.challenge_updates ?? true}
                  onChange={() => toggle('challenge_updates')}
                  aria-label="Class challenge completions"
                />
                <span className="teacher-slider" />
              </label>
            </div>

            {/* Category 4: Learning Insights */}
            <div className="teacher-pref-category-header">
              <span>💡</span>
              <strong>Learning Insights</strong>
            </div>

            <div className="teacher-pref-item">
              <div className="teacher-pref-info">
                <strong>Weekly Scripture Learning Insights</strong>
                <small>Receive summaries when your class improves recall or demonstrates strong memory retention.</small>
              </div>
              <label className="teacher-switch">
                <input
                  type="checkbox"
                  checked={prefs?.learning_insights ?? true}
                  onChange={() => toggle('learning_insights')}
                  aria-label="Learning insights"
                />
                <span className="teacher-slider" />
              </label>
            </div>

            {/* Category 5: Connections */}
            <div className="teacher-pref-category-header">
              <span>🤝</span>
              <strong>Connections &amp; Consent</strong>
            </div>

            <div className="teacher-pref-item">
              <div className="teacher-pref-info">
                <strong>Connection &amp; Consent Alerts</strong>
                <small>Notify me when a parent approves, declines, or revokes a student classroom connection.</small>
              </div>
              <label className="teacher-switch">
                <input
                  type="checkbox"
                  checked={prefs?.connection_alerts ?? true}
                  onChange={() => toggle('connection_alerts')}
                  aria-label="Connection and consent alerts"
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
