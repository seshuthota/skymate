export const runtime = 'nodejs';

import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { users } from '@/lib/users';

export async function GET(req: Request) {
  try {
    const userId = await requireUser(req);
    const profile = await users.getProfile(userId);
    return Response.json(profile);
  } catch (err: any) {
    return new Response(JSON.stringify({ code: 'GET_PROFILE_FAILED', message: err?.message || 'Error' }), { status: 400 });
  }
}

const PatchSchema = z.object({ name: z.string().min(1).max(120).optional(), email: z.string().email().optional() });

export async function PATCH(req: Request) {
  try {
    const userId = await requireUser(req);
    const body = await req.json();
    const parsed = PatchSchema.parse(body);
    const updated = await users.updateProfile(userId, parsed);
    return Response.json(updated);
  } catch (err: any) {
    return new Response(JSON.stringify({ code: 'UPDATE_PROFILE_FAILED', message: err?.message || 'Error' }), { status: 400 });
  }
}

