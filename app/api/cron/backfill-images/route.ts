import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { verifyCronAuth } from "@/lib/auth";
import { LEAGUE_IMAGES } from "@/lib/images";

export const maxDuration = 60;

const SITE_URL = "https://360-foot.com";

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient();

  // Fetch articles with no image
  const { data: articles, error } = await supabase
    .from("articles")
    .select("id, title, type, league_id")
    .or("og_image_url.is.null,og_image_url.eq.")
    .limit(200);

  if (error) {
    console.error("Backfill: error fetching articles", error.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  if (!articles || articles.length === 0) {
    return NextResponse.json({ message: "No articles to backfill", updated: 0 });
  }

  // Fetch all leagues for mapping
  const leagueIds = Array.from(new Set(articles.map((a) => a.league_id).filter(Boolean)));
  const { data: leagues } = await supabase
    .from("leagues")
    .select("id, name")
    .in("id", leagueIds.length > 0 ? leagueIds : [0]);

  const leagueMap = new Map<number, string>();
  if (leagues) {
    for (const l of leagues) {
      leagueMap.set(l.id, l.name);
    }
  }

  const genericImage = `${SITE_URL}/images/leagues/generic.jpg`;
  let updated = 0;
  const errors: string[] = [];

  for (const article of articles) {
    const leagueName = article.league_id ? leagueMap.get(article.league_id) : null;
    const leagueImage = leagueName ? LEAGUE_IMAGES[leagueName] : null;

    // Use league default image (full URL) or generic
    const imageUrl = leagueImage
      ? `${SITE_URL}${leagueImage}`
      : genericImage;

    const { error: updateError } = await supabase
      .from("articles")
      .update({ og_image_url: imageUrl })
      .eq("id", article.id);

    if (updateError) {
      errors.push(`${article.id}: ${updateError.message}`);
    } else {
      updated++;
    }
  }

  return NextResponse.json({
    message: `Backfill complete`,
    total: articles.length,
    updated,
    errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
  });
}
