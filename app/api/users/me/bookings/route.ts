export const runtime = 'nodejs';

import { bookings } from '@/lib/bookings';
import { requireUser } from '@/lib/auth';
import { ListBookingsSchema } from '@/lib/schemas';

export async function GET(req: Request) {
  try {
    const userId = await requireUser(req);
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams);
    const parsed = ListBookingsSchema.safeParse(params);
    if (!parsed.success) {
      return new Response(JSON.stringify({ code: 'INVALID_REQUEST', issues: parsed.error.issues }), { status: 400 });
    }
    const { status, cursor } = parsed.data;
    const data = await bookings.list(userId, status, cursor);
    return Response.json(data);
  } catch (err: any) {
    return new Response(JSON.stringify({ code: 'LIST_FAILED', message: err?.message || 'Error' }), { status: 400 });
  }
}

