'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStudentAssignments } from './useStudentAssignments';
import { sortByPriority, tabForAssignment, TAB_LABEL, type AssignmentTab } from './priority';
import { AssignmentCard } from './AssignmentCard';
import { AssignmentDetailModal } from './AssignmentDetailModal';
import type { StudentAssignment } from './types';

const TABS: AssignmentTab[] = ['to_do', 'in_progress', 'submitted', 'completed'];

const EMPTY_COPY: Record<AssignmentTab, string> = {
  to_do: "You're all caught up! 🎉",
  in_progress: 'Nothing in progress right now.',
  submitted: "You don't have anything waiting for review.",
  completed: 'Your completed assignments will appear here.',
};

export function AssignmentsPage({
  tone,
  initialOpenId,
  onInitialOpenHandled,
}: {
  tone: 'child' | 'teen';
  /** Deep-links from a notification: once assignments load, opens this one and switches to its tab. */
  initialOpenId?: string | null;
  onInitialOpenHandled?: () => void;
}) {
  const { assignments, state, reload } = useStudentAssignments();
  const [tab, setTab] = useState<AssignmentTab>('to_do');
  const [openAssignment, setOpenAssignment] = useState<StudentAssignment | null>(null);

  const grouped = useMemo(() => {
    const map: Record<AssignmentTab, StudentAssignment[]> = { to_do: [], in_progress: [], submitted: [], completed: [] };
    for (const a of assignments || []) map[tabForAssignment(a)].push(a);
    for (const key of TABS) map[key] = sortByPriority(map[key]);
    return map;
  }, [assignments]);

  useEffect(() => {
    if (!initialOpenId || !assignments) return;
    const match = assignments.find((a) => a.id === initialOpenId);
    if (match) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- deep-link from a notification, only runs once per initialOpenId
      setTab(tabForAssignment(match));
      setOpenAssignment(match);
    }
    onInitialOpenHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOpenId, assignments]);

  const overdueCount = (grouped.to_do || []).filter((a) => a.dueBucket === 'overdue').length;

  return (
    <div className={`assignments-page assignments-page-${tone}`}>
      <div className="assignments-page-head">
        <p className="assignments-page-kicker">{tone === 'teen' ? 'ASSIGNMENTS' : 'Assignments'}</p>
        <h1>{tone === 'teen' ? 'Your Assignments' : 'My Assignments'}</h1>
        <p className="assignments-page-sub">
          {tone === 'teen' ? 'Everything your teachers have sent your way.' : 'Here’s everything your teachers gave you to do.'}
        </p>
      </div>

      {state === 'ready' && assignments && (
        <div className="assignments-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={`assignments-tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {TAB_LABEL[t]}
              {t === 'to_do' && overdueCount > 0 && <em className="assignments-tab-flag">{overdueCount}</em>}
              {grouped[t].length > 0 && <span className="assignments-tab-count">{grouped[t].length}</span>}
            </button>
          ))}
        </div>
      )}

      {state === 'loading' && (
        <div className="assignments-page-skeleton" aria-hidden="true">
          <div className="assignments-skeleton-card" />
          <div className="assignments-skeleton-card" />
          <div className="assignments-skeleton-card" />
        </div>
      )}

      {state === 'error' && (
        <div className="assignments-page-error" role="alert">
          <p>Something went wrong loading your assignments. Try again.</p>
          <button type="button" onClick={reload}>Try again</button>
        </div>
      )}

      {state === 'ready' && assignments && (
        grouped[tab].length === 0 ? (
          <p className="assignments-page-empty">{EMPTY_COPY[tab]}</p>
        ) : (
          <div className="assignments-page-grid">
            {grouped[tab].map((a) => (
              <AssignmentCard key={a.id} assignment={a} tone={tone} onOpen={setOpenAssignment} />
            ))}
          </div>
        )
      )}

      {openAssignment && (
        <AssignmentDetailModal
          assignment={openAssignment}
          tone={tone}
          onClose={() => setOpenAssignment(null)}
          onChanged={reload}
        />
      )}
    </div>
  );
}
