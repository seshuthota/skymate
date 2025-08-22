import crypto from 'crypto';
import { Prisma } from '@prisma/client';
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
  // purge expired keys (>24h old)
  await db.idempotencyKey.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  if (!key) {
    // No key provided — just run once (prototype behavior)
    const result = await fn();
    return { reused: false, result };
  }
  const hash = hashKey(userId, method, path, key);
  const existing = await db.idempotencyKey.findUnique({ where: { hash } });
  if (existing) {
    return { reused: true, result: existing.response as T };
  }
  const result = await fn();
  await db.idempotencyKey.create({
    data: {
      userId: userId ?? null,
      method,
      path,
      key,
      hash,
      response: result as unknown as Prisma.JsonValue,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  return { reused: false, result };
}

