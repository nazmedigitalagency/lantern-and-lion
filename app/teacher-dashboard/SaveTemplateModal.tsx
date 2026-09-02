'use client';

import { useState } from 'react';
import type { AssignmentType } from '../lib/assignments/types';
import { CATEGORY_LABEL, type TemplateAgeGroup, type TemplateCategory } from '../lib/assignments/templates';

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABEL) as [TemplateCategory, string][];

export type TemplateSource = {
  assignmentType: AssignmentType;
  referenceId: string | null;
  instructions: string | null;
  timeLimitMinutes: number | null;
  requiredScore: number | null;
  xpReward: number | null;
  defaultTitle: string;
};

/** Saves an assignment's reusable configuration as a template — never anything a student submitted. */
export default function SaveTemplateModal({ source, onClose, onSaved }: { source: TemplateSource; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(source.defaultTitle);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('review');
  const [ageGroup, setAgeGroup] = useState<TemplateAgeGroup>('both');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function save() {
    if (!title.trim()) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/assignment-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          assignmentType: source.assignmentType,
          referenceId: source.referenceId || undefined,
          instructions: source.instructions || undefined,
          timeLimitMinutes: source.timeLimitMinutes ?? undefined,
          requiredScore: source.requiredScore ?? undefined,
          xpReward: source.xpReward ?? undefined,
          ageGroup,
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string; success?: boolean } | null;
      if (!res.ok || !data?.success) {
        setError(data?.error || 'Could not save this template.');
        return;
      }
      setDone(true);
      onSaved();
    } catch {
      setError('Could not save this template. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="add-student-overlay" role="presentation" onClick={onClose}>
      <section className="add-student-dialog" role="dialog" aria-modal="true" aria-labelledby="save-template-title" onClick={(e) => e.stopPropagation()}>
        <button className="student-detail-close" aria-label="Close" onClick={onClose}>×</button>

        {done ? (
          <>
            <span className="add-student-success-mark">✓</span>
            <h2 id="save-template-title">Template saved.</h2>
            <p className="add-student-note">Find it under My Templates next time you create an assignment.</p>
            <button type="button" className="add-student-primary" onClick={onClose}>Done</button>
          </>
        ) : (
          <>
            <h2 id="save-template-title">Save as template</h2>
            <label className="add-student-field">
              Template name
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
            </label>
            <label className="add-student-field">
              Description <small>(optional)</small>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={500} placeholder="What is this template for?" />
            </label>
            <label className="add-student-field">
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value as TemplateCategory)}>
                {CATEGORY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="add-student-field">
              Age group
              <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value as TemplateAgeGroup)}>
                <option value="both">Both children and teens</option>
                <option value="child">Children 5-12</option>
                <option value="teen">Teens 13-17</option>
              </select>
            </label>
            {error && <p className="add-student-error" role="alert">{error}</p>}
            <div className="add-student-actions">
              <button type="button" className="add-student-secondary" onClick={onClose}>Cancel</button>
              <button type="button" className="add-student-primary" disabled={busy || !title.trim()} onClick={save}>
                {busy ? 'Saving…' : 'Save template'}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
