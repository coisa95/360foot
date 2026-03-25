import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const CACHE_TTL = 60 * 60 * 24 * 7; // 7 days

export interface PexelsPhoto {
  id: number;
  url: string;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
  };
  width: number;
  height: number;
  alt: string;
}

export async function getCachedImages(
  query: string
): Promise<PexelsPhoto[] | null> {
  try {
    const cached = await redis.get<PexelsPhoto[]>(`img:${query}`);
    return cached || null;
  } catch {
    return null;
  }
}

export async function setCachedImages(
  query: string,
  photos: PexelsPhoto[]
): Promise<void> {
  try {
    await redis.set(`img:${query}`, JSON.stringify(photos), { ex: CACHE_TTL });
  } catch {
    // Silent fail — cache miss is not critical
  }
}

export async function canMakeApiCall(): Promise<boolean> {
  try {
    const count = await redis.incr("pexels:rate-limit");
    if (count === 1) {
      await redis.expire("pexels:rate-limit", 3600);
    }
    return count <= 180; // Keep 20 as buffer from 200 limit
  } catch {
    return true; // If Redis fails, allow the call
  }
}
