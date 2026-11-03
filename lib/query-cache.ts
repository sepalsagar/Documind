type CacheEntry<T> = { value: T; expiresAt: number };

declare global {
  var documindQueryCache: Map<string, CacheEntry<unknown>> | undefined;
}

const cache = global.documindQueryCache ?? (global.documindQueryCache = new Map());

export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (entry && entry.expiresAt > Date.now()) return entry.value;
  const value = await load();
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function invalidateCached(prefix: string) {
  for (const key of cache.keys()) if (key.startsWith(prefix)) cache.delete(key);
}
