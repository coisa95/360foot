import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Get a cached value by key, or fetch and cache it using the provided fetcher.
 * @param key - Cache key
 * @param fetcher - Async function that returns the data to cache
 * @param ttl - Time to live in seconds (default: 3600 = 1 hour)
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  const cached = await redis.get<T>(key);
  if (cached !== null && cached !== undefined) {
    return cached;
  }

  const fresh = await fetcher();
  await redis.set(key, JSON.stringify(fresh), { ex: ttl });
  return fresh;
}

/**
 * Invalidate (delete) a cached key.
 * @param key - Cache key to invalidate
 */
export async function invalidateCache(key: string): Promise<void> {
  await redis.del(key);
}
