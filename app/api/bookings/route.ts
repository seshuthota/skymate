export const runtime = 'nodejs';

import { z } from 'zod';
import { bookings } from '@/lib/bookings';
import { requireUser } from '@/lib/auth';
import { withIdempotency } from '@/lib/idempotency';

const Schema = z.object({
  offerId: z.string(),
  contact: z.any(),
  passengers: z.array(z.any()),
});

export async function POST(req: Request) {
  try {
    const userId = await requireUser(req);
    const args = Schema.parse(await req.json());
    const idem = req.headers.get('Idempotency-Key') || '';
    const { reused, result } = await withIdempotency(userId, 'POST', '/api/bookings', idem, () =>
      bookings.create(userId, args as any)
    );
    return new Response(
      JSON.stringify({ bookingId: result.id, status: result.status, providerRef: result.providerRef }),
      { status: reused ? 200 : 201 }
    );
  } catch (err: any) {
    const message = err?.message || 'Error creating booking';
    return new Response(JSON.stringify({ code: 'CREATE_FAILED', message }), { status: 400 });
  }
}

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

