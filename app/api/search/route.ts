import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ players: [], teams: [], articles: [], leagues: [] });
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
  return NextResponse.json({
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
}
