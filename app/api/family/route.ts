import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '../../lib/supabase/route-client';
import { createServerAdminClient } from '../../lib/supabase/server';

const ChildSchema = z.object({
  name: z.string().trim().min(1).max(48),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9]{2,18}$/),
  age: z.number().int().min(5).max(17),
  avatar: z.string().max(32),
  pin: z.string().regex(/^\d{4}$/),
  gender: z.enum(['male', 'female']).optional(),
});

const FamilySchema = z.object({
  familyName: z.string().trim().min(1).max(64),
  country: z.string().trim().min(1).max(64),
  timezone: z.string().trim().min(1).max(64).optional(),
  children: z.array(ChildSchema).max(5),
});

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in as a parent first.' }, { status: 401 });
  }

  const rawBody = await req.json().catch(() => null);
  const parsed = FamilySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid family setup payload.' }, { status: 400 });
  }

  const admin = createServerAdminClient();

  const { data: existingFamily } = await admin.from('families').select('id').eq('owner_id', user.id).maybeSingle();

  const familyFields = {
    owner_id: user.id,
    family_name: parsed.data.familyName,
    country: parsed.data.country,
    timezone: parsed.data.timezone || 'UTC',
  };

  const { data: family, error: familyError } = existingFamily
    ? await admin.from('families').update(familyFields).eq('id', existingFamily.id).select('id').maybeSingle()
    : await admin.from('families').insert(familyFields).select('id').maybeSingle();

  if (familyError || !family) {
    return NextResponse.json({ error: 'Could not save your family details.' }, { status: 500 });
  }

  for (const child of parsed.data.children) {
    const { data: existingUsername } = await admin
      .from('children')
      .select('id, family_id')
      .ilike('username', child.username)
      .maybeSingle();

    if (existingUsername && existingUsername.family_id !== family.id) {
      return NextResponse.json({ error: `The username "${child.username}" is already taken. Please choose another.` }, { status: 409 });
    }

    if (existingUsername) {
      await admin.from('children').update({ name: child.name, age: child.age, avatar: child.avatar, pin: child.pin }).eq('id', existingUsername.id);
    } else {
      await admin.from('children').insert({ family_id: family.id, name: child.name, username: child.username, age: child.age, avatar: child.avatar, pin: child.pin });
    }
  }

  return NextResponse.json({ success: true, familyId: family.id });
}
