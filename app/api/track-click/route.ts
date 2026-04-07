import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { Redis } from "@upstash/redis";
import { getClientIp, getClientCountry } from "@/lib/client-ip";

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
const RATE_LIMIT_MAX = 10; // requests per window

// Allowed bookmaker names to prevent arbitrary data injection
const ALLOWED_BOOKMAKERS = new Set([
  "1xbet",
  "betway",
  "bet365",
  "bwin",
  "unibet",
  "winamax",
  "parionssport",
  "zebet",
  "betclic",
  "pmu",
  "netbet",
  "vbet",
  "sportingbet",
  "melbet",
  "1win",
]);

export async function POST(request: Request) {
  try {
    // Validate content-type
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 415 }
      );
    }

    // Rate limiting: max 20 clicks per IP per minute
    const ip = getClientIp(request);
    if (redis) {
      const key = `ratelimit:click:${ip}`;
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, 60);
      if (count > 20) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
      }
    }

    const body = await request.json();
    const { bookmaker_name, article_id, page_url } = body;

    if (!bookmaker_name || typeof bookmaker_name !== "string" || bookmaker_name.length > 100) {
      return NextResponse.json(
        { error: "Invalid bookmaker_name" },
        { status: 400 }
      );
    }

    // Validate bookmaker name against allowlist
    const normalizedName = bookmaker_name.toLowerCase().trim();
    if (!ALLOWED_BOOKMAKERS.has(normalizedName)) {
      return NextResponse.json(
        { error: "Invalid bookmaker_name" },
        { status: 400 }
      );
    }

    // Validate optional fields
    if (page_url && (typeof page_url !== "string" || page_url.length > 2048)) {
      return NextResponse.json(
        { error: "Invalid page_url" },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const country = getClientCountry(request);

    const { error } = await supabase.from("affiliate_clicks").insert({
      bookmaker_name: normalizedName,
      article_id: article_id || null,
      page_url: page_url || null,
      country,
      clicked_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error tracking click:", error);
      return NextResponse.json(
        { error: "Failed to track click" },
        { status: 500 }
      );
    }

    const response = NextResponse.json({ success: true });

    // Rate limiting headers
    response.headers.set("X-RateLimit-Limit", String(RATE_LIMIT_MAX));
    response.headers.set("X-RateLimit-Window", `${RATE_LIMIT_WINDOW}s`);

    return response;
  } catch (error) {
    console.error("Error in track-click:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
