/**
 * GET /api/syndication/articles
 *
 * API publique de syndication — permet à un site partenaire (ex: afroprono)
 * de récupérer les articles de 360foot en JSON.
 *
 * Auth : header `x-api-key` obligatoire (= SYNDICATION_API_KEY en .env)
 *
 * Query params :
 *   - type     : filtrer par type (pronostic, streaming, result, transfer, recap, preview, player_profile)
 *                Accepte plusieurs valeurs séparées par virgule : ?type=pronostic,streaming
 *   - league   : filtrer par league slug (ex: ligue-1-cote-divoire)
 *   - limit    : nombre d'articles (défaut 20, max 50)
 *   - offset   : pagination (défaut 0)
 *   - since    : date ISO — articles publiés après cette date
 *
 * Réponse :
 *   { articles: [...], total: number, limit: number, offset: number }
 *
 * Chaque article contient :
 *   slug, title, excerpt, content, type, tags, published_at, og_image_url,
 *   seo_title, seo_description, league_name, league_slug,
 *   canonical_url (lien 360foot pour rel="canonical")
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { verifySyndicationApiKey as verifyApiKey } from "@/lib/syndication-auth";

export const revalidate = 0; // pas de cache — données fraîches

export async function GET(request: Request) {
  if (!verifyApiKey(request)) {
    return NextResponse.json(
      { error: "Unauthorized — x-api-key header required" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);

  // Parse params
  const typeParam = searchParams.get("type"); // "pronostic,streaming"
  const types = typeParam ? typeParam.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const leagueSlug = searchParams.get("league");
  const rawLimit = parseInt(searchParams.get("limit") || "", 10);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 50) : 20;
  const rawOffset = parseInt(searchParams.get("offset") || "", 10);
  const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0;
  const since = searchParams.get("since");

  const supabase = createClient();

  // Build query
  let query = supabase
    .from("articles")
    .select(
      "slug, title, excerpt, content, type, tags, published_at, og_image_url, seo_title, seo_description, league:leagues!league_id(name, slug)",
      { count: "exact" }
    )
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });

  // Filters
  if (types.length === 1) {
    query = query.eq("type", types[0]);
  } else if (types.length > 1) {
    query = query.in("type", types);
  }

  if (since) {
    query = query.gte("published_at", since);
  }

  // League filter via join
  if (leagueSlug) {
    // On filtre après la requête car Supabase ne supporte pas facilement
    // le filtre sur une relation dans le .select() sans RPC.
    // Alternative : sous-requête league_id
    const { data: leagueRow } = await supabase
      .from("leagues")
      .select("id")
      .eq("slug", leagueSlug)
      .single();

    if (leagueRow) {
      query = query.eq("league_id", leagueRow.id);
    }
  }

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data: articles, count, error } = await query;

  if (error) {
    console.error("[syndication/articles] Supabase error:", error.message);
    return NextResponse.json(
      { error: "Database error" },
      { status: 500 }
    );
  }

  // Format response
  const formatted = (articles || []).map((a: Record<string, unknown>) => {
    const league = a.league as Record<string, unknown> | null;
    return {
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      content: a.content,
      type: a.type,
      tags: a.tags,
      published_at: a.published_at,
      og_image_url: a.og_image_url,
      seo_title: a.seo_title,
      seo_description: a.seo_description,
      league_name: (league?.name as string) || null,
      league_slug: (league?.slug as string) || null,
      canonical_url: `https://360-foot.com/actu/${a.slug}`,
    };
  });

  return NextResponse.json({
    articles: formatted,
    total: count || 0,
    limit,
    offset,
  });
}
