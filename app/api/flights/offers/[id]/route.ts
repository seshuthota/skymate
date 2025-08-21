export const runtime = 'nodejs';

import { provider } from '@/lib/flights';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const offer = await provider.getOffer(params.id);
  if (!offer) return new Response('Not found', { status: 404 });
  return Response.json(offer);
}

