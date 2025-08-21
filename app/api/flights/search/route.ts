export const runtime = 'nodejs';

import { z } from 'zod';
import { provider } from '@/lib/flights';

const Schema = z.object({
  origin: z.string().min(3),
  destination: z.string().min(3),
  departDate: z.string(),
  returnDate: z.string().optional(),
  adults: z.number().int().min(1),
  children: z.number().int().min(0).optional(),
  infants: z.number().int().min(0).optional(),
  cabin: z.enum(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']).optional(),
  maxStops: z.number().int().min(0).optional(),
  sort: z.enum(['price', 'duration']).optional(),
});

export async function POST(req: Request) {
  try {
    const args = Schema.parse(await req.json());
    const offers = await provider.search(args as any);
    return Response.json({ offers });
  } catch (err: any) {
    return new Response(JSON.stringify({ code: 'BAD_REQUEST', message: err.message ?? 'Invalid request' }), { status: 400 });
  }
}

