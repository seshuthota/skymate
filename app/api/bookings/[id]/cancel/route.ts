export const runtime = 'nodejs';

import { bookings } from '@/lib/bookings';
import { requireUser } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUser(req);
    const body = await req.json().catch(() => ({}));
    const reason = body?.reason as string | undefined;
    const b = await bookings.cancel(userId, params.id, reason);
    return Response.json({ status: b.status });
  } catch (err: any) {
    return new Response(JSON.stringify({ code: 'CANCEL_FAILED', message: err?.message || 'Error' }), { status: 400 });
  }
}

