'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AssignmentType } from '../lib/assignments/types';
import { referenceLabel } from '../lib/assignments/content';
import { CATEGORY_LABEL, type AssignmentTemplate, type TemplateAgeGroup } from '../lib/assignments/templates';
import CreateAssignmentModal, { type AssignmentTemplatePrefill } from './CreateAssignmentModal';
import EditTemplateModal from './EditTemplateModal';

const TYPE_LABEL: Record<AssignmentType, string> = {
  story: 'Interactive Story',
  reading: 'Bible Reading',
  quiz: 'Bible Quiz',
  memory: 'Scripture Memory',
  game: 'Game Challenge',
  written: 'Written Response',
  custom: 'Custom Assignment',
};

const AGE_LABEL: Record<TemplateAgeGroup, string> = {
  child: 'Children 5-12',
  teen: 'Teens 13-17',
  both: 'Children & Teens',
};

const DIFFICULTY_LABEL: Record<AssignmentTemplate['difficulty'], string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

type TemplatesResponse = { builtIn: AssignmentTemplate[]; mine: AssignmentTemplate[] };

export default function TemplatesPanel() {
  const [data, setData] = useState<TemplatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<AssignmentType | 'all'>('all');
  const [ageFilter, setAgeFilter] = useState<TemplateAgeGroup | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'builtin' | 'mine'>('all');

  const [useTemplate, setUseTemplate] = useState<AssignmentTemplate | null>(null);
  const [editTemplate, setEditTemplate] = useState<AssignmentTemplate | null>(null);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [duplicateBusyId, setDuplicateBusyId] = useState<string | null>(null);

  function refresh() {
    fetch('/api/assignment-templates')
      .then((res) => (res.ok ? (res.json() as Promise<TemplatesResponse>) : Promise.reject()))
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError('Could not load templates — check your connection and try again.'); setLoading(false); });
  }

  useEffect(() => { refresh(); }, []);

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (t: AssignmentTemplate): boolean => {
      if (typeFilter !== 'all' && t.assignmentType !== typeFilter) return false;
      if (ageFilter !== 'all' && t.ageGroup !== ageFilter && t.ageGroup !== 'both') return false;
      if (q && !t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
      return true;
    };
  }, [search, typeFilter, ageFilter]);

  const builtIn = useMemo(() => (data?.builtIn || []).filter(matches), [data, matches]);
  const mine = useMemo(() => (data?.mine || []).filter(matches), [data, matches]);

  const showBuiltIn = sourceFilter !== 'mine';
  const showMine = sourceFilter !== 'builtin';

  async function deleteTemplate(id: string) {
    setDeleteBusyId(id);
    try {
      const res = await fetch(`/api/assignment-templates/${id}`, { method: 'DELETE' });
      if (res.ok) refresh();
    } finally {
      setDeleteBusyId(null);
    }
  }

  async function duplicateTemplate(id: string) {
    setDuplicateBusyId(id);
    try {
      const res = await fetch(`/api/assignment-templates/${id}/duplicate`, { method: 'POST' });
      if (res.ok) refresh();
    } finally {
      setDuplicateBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="teacher-students-loading">
        <span></span>
        <p>Loading templates…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="teacher-empty">
        <span>!</span>
        <div><strong>{error}</strong></div>
      </div>
    );
  }

  return (
    <>
      <div className="template-filters">
        <input type="search" placeholder="Search templates…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search templates" />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as AssignmentType | 'all')} aria-label="Filter by activity type">
          <option value="all">All activity types</option>
          {Object.entries(TYPE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select value={ageFilter} onChange={(e) => setAgeFilter(e.target.value as TemplateAgeGroup | 'all')} aria-label="Filter by age group">
          <option value="all">All ages</option>
          <option value="child">Children 5-12</option>
          <option value="teen">Teens 13-17</option>
        </select>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as 'all' | 'builtin' | 'mine')} aria-label="Filter by template source">
          <option value="all">All templates</option>
          <option value="builtin">Lantern &amp; Lion templates</option>
          <option value="mine">My templates</option>
        </select>
      </div>

      {showBuiltIn && (
        <section className="template-section">
          <h2>Lantern &amp; Lion Templates</h2>
          {builtIn.length === 0 ? (
            <p className="student-detail-empty">No built-in templates match your search.</p>
          ) : (
            <div className="template-grid">
              {builtIn.map((t) => (
                <TemplateCard key={t.id} template={t} onUse={() => setUseTemplate(t)} />
              ))}
            </div>
          )}
        </section>
      )}

      {showMine && (
        <section className="template-section">
          <h2>My Templates</h2>
          {mine.length === 0 ? (
            <div className="teacher-empty teacher-empty-students">
              <span>📋</span>
              <div>
                <strong>{data?.mine.length === 0 ? 'No saved templates yet.' : 'No templates match your search.'}</strong>
                <p>Create an assignment, then choose “Save as template” to reuse it next time.</p>
              </div>
            </div>
          ) : (
            <div className="template-grid">
              {mine.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  onUse={() => setUseTemplate(t)}
                  onEdit={() => setEditTemplate(t)}
                  onDuplicate={() => duplicateTemplate(t.id)}
                  onDelete={() => deleteTemplate(t.id)}
                  busy={deleteBusyId === t.id || duplicateBusyId === t.id}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {useTemplate && (
        <CreateAssignmentModal
          initialTemplate={toPrefill(useTemplate)}
          onClose={() => setUseTemplate(null)}
          onCreated={() => {}}
        />
      )}

      {editTemplate && (
        <EditTemplateModal
          template={editTemplate}
          onClose={() => setEditTemplate(null)}
          onSaved={() => { setEditTemplate(null); refresh(); }}
        />
      )}
    </>
  );
}

function toPrefill(t: AssignmentTemplate): AssignmentTemplatePrefill {
  return {
    title: t.title,
    instructions: t.instructions,
    assignmentType: t.assignmentType,
    referenceId: t.referenceId,
    timeLimitMinutes: t.timeLimitMinutes,
    requiredScore: t.requiredScore,
    xpReward: t.xpReward,
    ageGroup: t.ageGroup,
  };
}

function TemplateCard({ template, onUse, onEdit, onDuplicate, onDelete, busy }: {
  template: AssignmentTemplate;
  onUse: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  busy?: boolean;
}) {
  const contentLabel = template.referenceId ? referenceLabel(template.assignmentType, template.referenceId) : null;
  return (
    <div className="template-card">
      <div className="template-card-head">
        <strong>{template.title}</strong>
        <span className="template-badge">{TYPE_LABEL[template.assignmentType]}</span>
      </div>
      <p className="template-card-desc">{template.description}{contentLabel ? ` — ${contentLabel}` : ''}</p>
      <div className="template-card-meta">
        <span>⏱ ~{template.estimatedMinutes} min</span>
        <span>{AGE_LABEL[template.ageGroup]}</span>
        <span>{DIFFICULTY_LABEL[template.difficulty]}</span>
      </div>
      <div className="template-card-actions">
        <button type="button" className="add-student-primary" onClick={onUse}>Use Template</button>
        {onEdit && <button type="button" onClick={onEdit}>Edit</button>}
        {onDuplicate && <button type="button" disabled={busy} onClick={onDuplicate}>Duplicate</button>}
        {onDelete && <button type="button" className="student-detail-remove" disabled={busy} onClick={onDelete}>Delete</button>}
      </div>
      <span className="template-category">{CATEGORY_LABEL[template.category]}</span>
    </div>
  );
}
