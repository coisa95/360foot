import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

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

  const supabase = createClient();
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

  // Rate limiting headers (informational; enforce via middleware or edge for strict limiting)
  response.headers.set("X-RateLimit-Limit", String(RATE_LIMIT_MAX));
  response.headers.set("X-RateLimit-Window", `${RATE_LIMIT_WINDOW}s`);
  response.headers.set("Cache-Control", "public, s-maxage=10, stale-while-revalidate=30");

  return response;
}
