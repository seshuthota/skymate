export const runtime = 'nodejs';

function setCookie(name: string, value: string, maxAgeDays = 30) {
  const maxAge = maxAgeDays * 24 * 60 * 60;
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const uid = url.searchParams.get('uid') || 'user_dev_1';
  const headers = new Headers({ 'Set-Cookie': setCookie('uid', uid) });
  return new Response(JSON.stringify({ ok: true, uid }), { headers });
}

