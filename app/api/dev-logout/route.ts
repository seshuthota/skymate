export const runtime = 'nodejs';

export async function GET() {
  const headers = new Headers({ 'Set-Cookie': 'uid=; Path=/; Max-Age=0; SameSite=Lax' });
  return new Response(JSON.stringify({ ok: true }), { headers });
}

