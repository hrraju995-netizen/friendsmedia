const windowMs = 60_000;
const maxRequests = 20;

const store = new Map<string, { count: number; resetAt: number }>();

export function assertRateLimit(key: string) {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (existing.count >= maxRequests) {
    throw new Error("Too many requests. Please wait a minute and try again.");
  }

  existing.count += 1;
}

