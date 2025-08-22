export const runtime = 'nodejs';

import { z } from 'zod';
import { bookings } from '@/lib/bookings';
import { requireUser } from '@/lib/auth';
import { withIdempotency } from '@/lib/idempotency';
import { ContactSchema, PassengerSchema } from '@/lib/flights/types';

const Schema = z.object({
  offerId: z.string(),
  contact: ContactSchema,
  passengers: z.array(PassengerSchema),
});

export async function POST(req: Request) {
  try {
    const userId = await requireUser(req);
    const args = Schema.parse(await req.json());
    const idem = req.headers.get('Idempotency-Key') || '';
    const { result } = await withIdempotency(userId, 'POST', '/api/bookings', idem, () =>
      bookings.create(userId, args)
    );
    return new Response(
      JSON.stringify({ bookingId: result.id, status: result.status, providerRef: result.providerRef }),
      { status: 201 }
    );
  } catch (err: any) {
    const message = err?.message || 'Error creating booking';
    const code = message.includes('idempotent') ? 'IDEMPOTENT_REPLAY' : 'CREATE_FAILED';
    const status = code === 'IDEMPOTENT_REPLAY' ? 409 : 400;
    return new Response(JSON.stringify({ code, message }), { status });
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

