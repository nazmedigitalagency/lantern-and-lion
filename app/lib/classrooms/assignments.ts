import type { SupabaseClient } from '@supabase/supabase-js';
import { getStory } from '../../stories/catalog';
import { getConcept } from '../adaptive/concepts';
import { assignmentStatus } from './server';
import type { ClassroomAssignment } from './types';

type AssignmentRow = {
  id: string;
  title: string;
  description: string | null;
  assignment_type: 'story' | 'concept';
  reference_id: string;
  due_date: string | null;
  created_at: string;
};

function referenceLabel(type: 'story' | 'concept', referenceId: string): string {
  if (type === 'story') return getStory(referenceId)?.title || referenceId;
  return getConcept(referenceId)?.label || referenceId;
}

/**
 * Loads a classroom's assignments and computes real completion counts
 * against the content each one actually points at — story_progress for a
 * story assignment, concept_mastery for a curriculum-concept assignment.
 * Never a stored "completed" flag a teacher has to maintain by hand.
 */
export async function computeClassroomAssignments(admin: SupabaseClient, classroomId: string, childIds: string[]): Promise<ClassroomAssignment[]> {
  const { data: rows } = await admin
    .from('classroom_assignments')
    .select('id, title, description, assignment_type, reference_id, due_date, created_at')
    .eq('classroom_id', classroomId)
    .order('due_date', { ascending: true, nullsFirst: false });

  const assignments = (rows || []) as AssignmentRow[];
  if (assignments.length === 0) return [];

  const totalStudents = childIds.length;
  const storyIds = Array.from(new Set(assignments.filter((a) => a.assignment_type === 'story').map((a) => a.reference_id)));
  const conceptIds = Array.from(new Set(assignments.filter((a) => a.assignment_type === 'concept').map((a) => a.reference_id)));

  const completedChildrenByStory = new Map<string, Set<string>>();
  if (storyIds.length > 0 && totalStudents > 0) {
    const { data: storyRows } = await admin
      .from('story_progress')
      .select('child_id, story_id')
      .in('child_id', childIds)
      .in('story_id', storyIds)
      .eq('status', 'completed');
    for (const r of storyRows || []) {
      const set = completedChildrenByStory.get(r.story_id) || new Set<string>();
      set.add(r.child_id);
      completedChildrenByStory.set(r.story_id, set);
    }
  }

  const practicedChildrenByConcept = new Map<string, Set<string>>();
  if (conceptIds.length > 0 && totalStudents > 0) {
    const { data: conceptRows } = await admin
      .from('concept_mastery')
      .select('child_id, concept_id')
      .in('child_id', childIds)
      .in('concept_id', conceptIds);
    for (const r of conceptRows || []) {
      const set = practicedChildrenByConcept.get(r.concept_id) || new Set<string>();
      set.add(r.child_id);
      practicedChildrenByConcept.set(r.concept_id, set);
    }
  }

  return assignments.map((a) => {
    const completedSet = a.assignment_type === 'story' ? completedChildrenByStory.get(a.reference_id) : practicedChildrenByConcept.get(a.reference_id);
    const completedCount = completedSet?.size || 0;
    const completionPercent = totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0;
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      assignmentType: a.assignment_type,
      referenceId: a.reference_id,
      referenceLabel: referenceLabel(a.assignment_type, a.reference_id),
      dueDate: a.due_date,
      createdAt: a.created_at,
      completedCount,
      totalStudents,
      completionPercent,
      status: assignmentStatus(a.due_date, completionPercent),
    };
  });
}
