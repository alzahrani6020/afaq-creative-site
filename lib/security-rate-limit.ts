import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

const fallback = new Map<string, { count: number; resetAt: number }>();

function hashIdentifier(scope: string, identifier: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (secret) {
    return crypto.createHmac('sha256', secret).update(`${scope}:${identifier}`).digest('hex');
  }
  return crypto.createHash('sha256').update(`${scope}:${identifier}`).digest('hex');
}

function fallbackAllow(key: string, windowMs: number, max: number): boolean {
  const now = Date.now();
  const current = fallback.get(key);
  if (!current || now > current.resetAt) {
    fallback.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= max) return false;
  current.count += 1;
  return true;
}

export async function checkPersistentRateLimit(options: {
  scope: string;
  identifier: string;
  windowMs: number;
  max: number;
}): Promise<boolean> {
  const { scope, identifier, windowMs, max } = options;
  const digest = hashIdentifier(scope, identifier || 'unknown');
  const since = new Date(Date.now() - windowMs);

  try {
    await prisma.oAuthLoginAttempt.create({
      data: {
        outcome: scope,
        detail: digest,
        hasCode: false,
      },
    });

    const count = await prisma.oAuthLoginAttempt.count({
      where: {
        outcome: scope,
        detail: digest,
        createdAt: { gte: since },
      },
    });
    return count <= max;
  } catch (error) {
    console.error('Persistent rate limiter unavailable; using process fallback', {
      scope,
      error: error instanceof Error ? error.message : String(error),
    });
    return fallbackAllow(`${scope}:${digest}`, windowMs, max);
  }
}
