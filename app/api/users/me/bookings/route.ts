export const runtime = 'nodejs';

import { bookings } from '@/lib/bookings';
import { requireUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const userId = await requireUser(req);
    const url = new URL(req.url);
    const status = url.searchParams.get('status') ?? undefined;
    const cursor = url.searchParams.get('cursor') ?? undefined;
    const data = await bookings.list(userId, status || undefined, cursor || undefined);
    return Response.json(data);
  } catch (err: any) {
    return new Response(JSON.stringify({ code: 'LIST_FAILED', message: err?.message || 'Error' }), { status: 400 });
  }
}

