/**
 * GET /api/syndication/matches
 *
 * API de syndication — matchs du jour avec scores, équipes, logos.
 *
 * Auth : header `x-api-key` obligatoire (= SYNDICATION_API_KEY en .env)
 *
 * Query params :
 *   - date    : date au format YYYY-MM-DD (défaut : aujourd'hui)
 *   - league  : filtrer par league slug
 *   - status  : filtrer par statut (NS, 1H, HT, 2H, FT, etc.)
 *   - limit   : nombre de matchs (défaut 30, max 100)
 *
 * Réponse :
 *   { matches: [...], total: number, date: string }
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export const revalidate = 0;

function verifyApiKey(request: Request): boolean {
  const key = request.headers.get("x-api-key");
  const expected = process.env.SYNDICATION_API_KEY;
  if (!expected) return false;
  return key === expected;
}

export async function GET(request: Request) {
  if (!verifyApiKey(request)) {
    return NextResponse.json(
      { error: "Unauthorized — x-api-key header required" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const leagueSlug = searchParams.get("league");
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") || "30", 10) || 30, 100);

  const supabase = createClient();

  let query = supabase
    .from("matches")
    .select(
      "slug, date, status, score_home, score_away, home_team:teams!home_team_id(name, slug, logo_url), away_team:teams!away_team_id(name, slug, logo_url), league:leagues(name, slug)",
      { count: "exact" }
    )
    .gte("date", `${dateParam}T00:00:00`)
    .lte("date", `${dateParam}T23:59:59`)
    .order("date", { ascending: true })
    .limit(limit);

  if (status) {
    query = query.eq("status", status);
  }

  if (leagueSlug) {
    const { data: leagueRow } = await supabase
      .from("leagues")
      .select("id")
      .eq("slug", leagueSlug)
      .single();

    if (leagueRow) {
      query = query.eq("league_id", leagueRow.id);
    }
  }

  const { data: matches, count, error } = await query;

  if (error) {
    console.error("[syndication/matches] Supabase error:", error.message);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const formatted = (matches || []).map((m: Record<string, unknown>) => {
    const homeTeam = m.home_team as Record<string, unknown> | null;
    const awayTeam = m.away_team as Record<string, unknown> | null;
    const league = m.league as Record<string, unknown> | null;
    return {
      slug: m.slug,
      date: m.date,
      status: m.status,
      score_home: m.score_home,
      score_away: m.score_away,
      home_team: {
        name: homeTeam?.name || null,
        slug: homeTeam?.slug || null,
        logo_url: homeTeam?.logo_url || null,
      },
      away_team: {
        name: awayTeam?.name || null,
        slug: awayTeam?.slug || null,
        logo_url: awayTeam?.logo_url || null,
      },
      league_name: (league?.name as string) || null,
      league_slug: (league?.slug as string) || null,
      canonical_url: `https://360-foot.com/match/${m.slug}`,
    };
  });

  return NextResponse.json({
    matches: formatted,
    total: count || 0,
    date: dateParam,
  });
}
