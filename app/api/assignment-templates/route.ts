import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '../../lib/supabase/route-client';
import { createServerAdminClient } from '../../lib/supabase/server';
import { referenceExists } from '../../lib/assignments/content';
import { BUILT_IN_TEMPLATES, type AssignmentTemplate } from '../../lib/assignments/templates';

type TemplateRow = {
  id: string;
  title: string;
  description: string | null;
  category: AssignmentTemplate['category'];
  assignment_type: AssignmentTemplate['assignmentType'];
  reference_id: string | null;
  instructions: string | null;
  time_limit_minutes: number | null;
  required_score: number | null;
  xp_reward: number | null;
  age_group: AssignmentTemplate['ageGroup'];
};

function toTemplate(row: TemplateRow): AssignmentTemplate {
  return {
    id: row.id,
    source: 'mine',
    title: row.title,
    description: row.description || '',
    category: row.category,
    assignmentType: row.assignment_type,
    referenceId: row.reference_id,
    instructions: row.instructions,
    estimatedMinutes: row.time_limit_minutes || 15,
    ageGroup: row.age_group,
    difficulty: 'medium',
    timeLimitMinutes: row.time_limit_minutes,
    requiredScore: row.required_score,
    xpReward: row.xp_reward,
  };
}

/** Every Lantern & Lion built-in template plus this teacher's own saved templates. */
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const admin = createServerAdminClient();
  const { data: rows } = await admin
    .from('assignment_templates')
    .select('id, title, description, category, assignment_type, reference_id, instructions, time_limit_minutes, required_score, xp_reward, age_group')
    .eq('teacher_id', user.id)
    .order('title', { ascending: true });

  return NextResponse.json({
    builtIn: BUILT_IN_TEMPLATES,
    mine: (rows || []).map(toTemplate),
  });
}

const SaveSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  category: z.enum(['scripture_memory', 'bible_knowledge', 'reading', 'games', 'stories', 'reflection', 'review']),
  assignmentType: z.enum(['story', 'reading', 'quiz', 'memory', 'game', 'written', 'custom']),
  referenceId: z.string().trim().max(64).optional(),
  instructions: z.string().trim().max(2000).optional(),
  timeLimitMinutes: z.number().int().min(1).max(600).optional(),
  requiredScore: z.number().int().min(0).max(100).optional(),
  xpReward: z.number().int().min(0).max(2000).optional(),
  ageGroup: z.enum(['child', 'teen', 'both']).default('both'),
});

/**
 * Saves a reusable template — configuration only. The request only ever
 * carries type/content-reference/instructions/limits/rewards, never a
 * classroom, a student list, a due date, or anything from a submission —
 * there is no code path here that could pull in private student data.
 */
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const rawBody = await req.json().catch(() => null);
  const parsed = SaveSchema.safeParse(rawBody);
  if (!parsed.success) return NextResponse.json({ error: 'Please fill in the required fields.' }, { status: 400 });
  const data = parsed.data;

  const needsReference = data.assignmentType !== 'written' && data.assignmentType !== 'custom';
  if (needsReference && (!data.referenceId || !referenceExists(data.assignmentType, data.referenceId))) {
    return NextResponse.json({ error: 'This assignment’s content could not be saved as a template.' }, { status: 400 });
  }

  const admin = createServerAdminClient();
  const { data: template, error } = await admin
    .from('assignment_templates')
    .insert({
      teacher_id: user.id,
      title: data.title,
      description: data.description || null,
      category: data.category,
      assignment_type: data.assignmentType,
      reference_id: needsReference ? data.referenceId : null,
      instructions: data.instructions || null,
      time_limit_minutes: data.timeLimitMinutes ?? null,
      required_score: data.requiredScore ?? null,
      xp_reward: data.xpReward ?? null,
      age_group: data.ageGroup,
    })
    .select('id')
    .maybeSingle();

  if (error || !template) return NextResponse.json({ error: 'Could not save this template.' }, { status: 500 });
  return NextResponse.json({ success: true, id: template.id });
}
