import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
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

export async function POST(request: Request) {
  try {
    // Rate limiting: max 20 clicks per IP per minute
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
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

    const supabase = createClient();
    const country = request.headers.get("x-vercel-ip-country") || "unknown";

    const { error } = await supabase.from("affiliate_clicks").insert({
      bookmaker_name,
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in track-click:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
