import crypto from 'crypto';
import { db } from './prisma';

function hashKey(userId: string | null, method: string, path: string, key: string) {
  const h = crypto.createHash('sha256');
  h.update(`${userId ?? 'anon'}|${method}|${path}|${key}`);
  return h.digest('hex');
}

export async function withIdempotency<T>(
  userId: string | null,
  method: string,
  path: string,
  key: string,
  fn: () => Promise<T>
): Promise<{ reused: boolean; result: T }> {
  if (!key) {
    // No key provided — just run once (prototype behavior)
    const result = await fn();
    return { reused: false, result };
  }
  const hash = hashKey(userId, method, path, key);
  const existing = await db.idempotencyKey.findUnique({ where: { hash } });
  if (existing) {
    // We don't persist result bodies in prototype; caller should be idempotent.
    throw new Error('Duplicate request (idempotent key reused)');
  }
  const result = await fn();
  await db.idempotencyKey.create({ data: { userId: userId ?? null, method, path, key, hash } });
  return { reused: false, result };
}

