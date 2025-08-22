export const runtime = 'nodejs';

import { z } from 'zod';
import { bookings } from '@/lib/bookings';
import { requireUser } from '@/lib/auth';
import { ContactSchema, PassengerSchema } from '@/lib/flights/types';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUser(req);
    const data = await bookings.get(userId, params.id);
    return Response.json(data);
  } catch (err: any) {
    return new Response(JSON.stringify({ code: 'GET_FAILED', message: err?.message || 'Error' }), { status: 404 });
  }
}

const PatchSchema = z.object({
  contact: ContactSchema.optional(),
  passengers: z.array(PassengerSchema).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUser(req);
    const body = await req.json();
    const patch = PatchSchema.parse(body);
    const updated = await bookings.update(userId, params.id, patch);
    return Response.json(updated);
  } catch (err: any) {
    return new Response(JSON.stringify({ code: 'UPDATE_FAILED', message: err?.message || 'Error' }), { status: 400 });
  }
}
