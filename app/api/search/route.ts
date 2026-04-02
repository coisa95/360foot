import { NextResponse } from "next/server";
import { createAnonClient } from "@/lib/supabase";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch { /* Redis optional */ }

const RATE_LIMIT_WINDOW = 60; // seconds
const RATE_LIMIT_MAX = 30; // requests per window

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ players: [], teams: [], articles: [], leagues: [] });
  }

  // Cap query length to prevent abuse
  if (q.length > 100) {
    return NextResponse.json(
      { error: "Query too long" },
      { status: 400 }
    );
  }

  // Rate limiting: max 30 requests per IP per minute
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  let rateLimitRemaining = RATE_LIMIT_MAX;
  if (redis) {
    try {
      const key = `ratelimit:search:${ip}`;
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, RATE_LIMIT_WINDOW);
      rateLimitRemaining = Math.max(0, RATE_LIMIT_MAX - count);
      if (count > RATE_LIMIT_MAX) {
        const ttl = await redis.ttl(key);
        const res = NextResponse.json({ error: "Too many requests" }, { status: 429 });
        res.headers.set("X-RateLimit-Limit", String(RATE_LIMIT_MAX));
        res.headers.set("X-RateLimit-Remaining", "0");
        res.headers.set("X-RateLimit-Reset", String(ttl > 0 ? ttl : RATE_LIMIT_WINDOW));
        return res;
      }
    } catch {
      /* Redis failure: allow request through */
    }
  }

  const supabase = createAnonClient();
  const searchPattern = `%${q}%`;

  // Run all searches in parallel
  const [playersRes, teamsRes, articlesRes, leaguesRes] = await Promise.all([
    supabase
      .from("players")
      .select("name, slug, photo_url, position, team:teams!team_id(name)")
      .ilike("name", searchPattern)
      .limit(10),
    supabase
      .from("teams")
      .select("name, slug, logo_url, league:leagues!league_id(name)")
      .ilike("name", searchPattern)
      .limit(10),
    supabase
      .from("articles")
      .select("title, slug, type, published_at")
      .not("published_at", "is", null)
      .ilike("title", searchPattern)
      .order("published_at", { ascending: false })
      .limit(10),
    supabase
      .from("leagues")
      .select("name, slug, logo_url, country")
      .ilike("name", searchPattern)
      .limit(5),
  ]);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const response = NextResponse.json({
    players: (playersRes.data || []).map((p: any) => ({
      name: p.name,
      slug: p.slug,
      photo_url: p.photo_url,
      position: p.position,
      team_name: p.team?.name || null,
    })),
    teams: (teamsRes.data || []).map((t: any) => ({
      name: t.name,
      slug: t.slug,
      logo_url: t.logo_url,
      league_name: t.league?.name || null,
    })),
    articles: (articlesRes.data || []).map((a: any) => ({
      title: a.title,
      slug: a.slug,
      type: a.type,
      published_at: a.published_at,
    })),
    leagues: (leaguesRes.data || []).map((l: any) => ({
      name: l.name,
      slug: l.slug,
      logo_url: l.logo_url,
      country: l.country,
    })),
  });

  // Rate limiting headers
  response.headers.set("X-RateLimit-Limit", String(RATE_LIMIT_MAX));
  response.headers.set("X-RateLimit-Remaining", String(rateLimitRemaining));
  response.headers.set("X-RateLimit-Reset", String(RATE_LIMIT_WINDOW));
  response.headers.set("Cache-Control", "public, s-maxage=10, stale-while-revalidate=30");

  return response;
}
