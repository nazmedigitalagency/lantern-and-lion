'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AssignmentType } from '../lib/assignments/types';
import { assignableConcepts, assignableGames, assignableStories } from '../lib/assignments/content';
import { CATEGORY_LABEL, type AssignmentTemplate, type TemplateAgeGroup, type TemplateCategory } from '../lib/assignments/templates';

const TYPE_OPTIONS: { value: AssignmentType; label: string }[] = [
  { value: 'story', label: 'Interactive Story' },
  { value: 'reading', label: 'Bible Reading' },
  { value: 'quiz', label: 'Bible Quiz' },
  { value: 'memory', label: 'Scripture Memory' },
  { value: 'game', label: 'Game Challenge' },
  { value: 'written', label: 'Written Response' },
  { value: 'custom', label: 'Custom Assignment' },
];

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABEL) as [TemplateCategory, string][];

/** Edits one of the teacher's own templates — configuration only, same fields "Save as template" writes. */
export default function EditTemplateModal({ template, onClose, onSaved }: { template: AssignmentTemplate; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(template.title);
  const [description, setDescription] = useState(template.description);
  const [category, setCategory] = useState<TemplateCategory>(template.category);
  const [type, setType] = useState<AssignmentType>(template.assignmentType);
  const [referenceId, setReferenceId] = useState(template.referenceId || '');
  const [instructions, setInstructions] = useState(template.instructions || '');
  const [timeLimit, setTimeLimit] = useState(template.timeLimitMinutes != null ? String(template.timeLimitMinutes) : '');
  const [requiredScore, setRequiredScore] = useState(template.requiredScore != null ? String(template.requiredScore) : '');
  const [xpReward, setXpReward] = useState(template.xpReward != null ? String(template.xpReward) : '');
  const [ageGroup, setAgeGroup] = useState<TemplateAgeGroup>(template.ageGroup);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const contentOptions = useMemo(() => {
    if (type === 'story') return assignableStories();
    if (type === 'reading' || type === 'quiz' || type === 'memory') return assignableConcepts();
    if (type === 'game') return assignableGames();
    return [];
  }, [type]);

  useEffect(() => {
    if (contentOptions.length > 0 && !contentOptions.some((c) => c.id === referenceId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- switching type clears a now-invalid content selection
      setReferenceId(contentOptions[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const needsContent = type !== 'written' && type !== 'custom';
  const canSave = title.trim().length > 0 && (!needsContent || Boolean(referenceId));

  async function save() {
    if (!canSave) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/assignment-templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          assignmentType: type,
          referenceId: needsContent ? referenceId : undefined,
          instructions: instructions.trim() || undefined,
          timeLimitMinutes: timeLimit ? Number(timeLimit) : undefined,
          requiredScore: requiredScore ? Number(requiredScore) : undefined,
          xpReward: xpReward ? Number(xpReward) : undefined,
          ageGroup,
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string; success?: boolean } | null;
      if (!res.ok || !data?.success) {
        setError(data?.error || 'Could not save this template.');
        return;
      }
      onSaved();
    } catch {
      setError('Could not save this template. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="add-student-overlay" role="presentation" onClick={onClose}>
      <section className="add-student-dialog create-assignment-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-template-title" onClick={(e) => e.stopPropagation()}>
        <button className="student-detail-close" aria-label="Close" onClick={onClose}>×</button>
        <h2 id="edit-template-title">Edit template</h2>

        <label className="add-student-field">
          Assignment type
          <select value={type} onChange={(e) => setType(e.target.value as AssignmentType)}>
            {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>

        {needsContent && (
          <label className="add-student-field">
            {type === 'story' ? 'Story' : type === 'game' ? 'Game' : 'Lesson'}
            <select value={referenceId} onChange={(e) => setReferenceId(e.target.value)}>
              {contentOptions.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </label>
        )}

        <label className="add-student-field">
          Template name
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
        </label>
        <label className="add-student-field">
          Description <small>(optional)</small>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={500} />
        </label>
        <label className="add-student-field">
          Instructions <small>(optional)</small>
          <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={2} maxLength={2000} />
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

        <div className="classroom-create-meeting">
          <label className="add-student-field">
            Time limit (minutes) <small>(optional)</small>
            <input type="number" min={1} max={600} value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} />
          </label>
          <label className="add-student-field">
            Required score % <small>(optional)</small>
            <input type="number" min={0} max={100} value={requiredScore} onChange={(e) => setRequiredScore(e.target.value)} />
          </label>
        </div>
        <label className="add-student-field">
          XP reward <small>(optional)</small>
          <input type="number" min={0} max={2000} value={xpReward} onChange={(e) => setXpReward(e.target.value)} />
        </label>

        {error && <p className="add-student-error" role="alert">{error}</p>}
        <div className="add-student-actions">
          <button type="button" className="add-student-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="add-student-primary" disabled={busy || !canSave} onClick={save}>{busy ? 'Saving…' : 'Save changes'}</button>
        </div>
      </section>
    </div>
  );
}
