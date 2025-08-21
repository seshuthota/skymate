// Minimal auth stub for prototype
// Replace with NextAuth getServerSession later.

function parseCookie(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const [k, v] = part.split('=');
    if (k && v) out[k.trim()] = decodeURIComponent(v);
  }
  return out;
}

export async function requireUser(req: Request): Promise<string> {
  const cookies = parseCookie(req.headers.get('cookie'));
  const cookieId = cookies['uid'];
  const headerId = req.headers.get('x-user-id');
  const id = cookieId || headerId;
  if (!id) throw new Response('Unauthorized', { status: 401 });
  return id;
}

