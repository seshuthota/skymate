// Minimal auth stub for prototype
// Replace with NextAuth getServerSession later.

import { RequestCookies } from 'next/dist/server/web/spec-extension/cookies';

export async function requireUser(req: Request): Promise<string> {
  const cookieStore = new RequestCookies(req.headers);
  const cookieId = cookieStore.get('uid')?.value;
  const headerId = req.headers.get('x-user-id');
  const id = cookieId || headerId;
  if (!id) throw new Response('Unauthorized', { status: 401 });
  return id;
}

