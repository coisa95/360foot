/**
 * GET /api/syndication/standings
 *
 * API de syndication — classements des ligues.
 *
 * Auth : header `x-api-key` obligatoire (= SYNDICATION_API_KEY en .env)
 *
 * Query params :
 *   - league  : slug de la ligue (obligatoire, ou "all" pour toutes)
 *
 * Réponse :
 *   { standings: [{ league_name, league_slug, season, rows: [...] }] }
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
  const leagueSlug = searchParams.get("league");

  if (!leagueSlug) {
    return NextResponse.json(
      { error: "Query param 'league' required (slug or 'all')" },
      { status: 400 }
    );
  }

  const supabase = createClient();

  let query = supabase
    .from("standings")
    .select("league_id, season, data_json, updated_at, leagues(name, slug)")
    .order("updated_at", { ascending: false });

  if (leagueSlug !== "all") {
    const { data: leagueRow } = await supabase
      .from("leagues")
      .select("id")
      .eq("slug", leagueSlug)
      .single();

    if (!leagueRow) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }
    query = query.eq("league_id", leagueRow.id).limit(1);
  } else {
    query = query.limit(30);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[syndication/standings] Supabase error:", error.message);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const standings = (data || []).map((s: Record<string, unknown>) => {
    const league = s.leagues as Record<string, unknown> | null;
    return {
      league_name: (league?.name as string) || null,
      league_slug: (league?.slug as string) || null,
      season: s.season,
      updated_at: s.updated_at,
      rows: s.data_json,
    };
  });

  return NextResponse.json({ standings });
}
