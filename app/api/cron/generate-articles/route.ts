import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getMatchDetails } from "@/lib/api-football";
import { generateArticle } from "@/lib/claude";
import {
  systemPrompt as RESULT_SYSTEM_PROMPT,
  buildUserPrompt as buildResultUserPrompt,
} from "@/lib/prompts/result-article";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[àâä]/g, "a")
    .replace(/[éèêë]/g, "e")
    .replace(/[ïî]/g, "i")
    .replace(/[ôö]/g, "o")
    .replace(/[ùûü]/g, "u")
    .replace(/[ç]/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();

    // Get existing result articles to avoid duplicates
    const { data: existingArticles } = await supabase
      .from("articles")
      .select("match_id")
      .eq("type", "result");

    const existingMatchIds = new Set(
      (existingArticles || []).map((a: Record<string, unknown>) => a.match_id)
    );

    // Find finished matches
    const { data: finishedMatches } = await supabase
      .from("matches")
      .select("*, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name), league:leagues(name)")
      .eq("status", "FT");

    const matchesWithoutArticles = (finishedMatches || []).filter(
      (m: Record<string, unknown>) => !existingMatchIds.has(m.id)
    );

    let articlesGenerated = 0;

    for (const match of matchesWithoutArticles) {
      try {
        const detail = match.api_football_id
          ? await getMatchDetails(match.api_football_id as number)
          : null;
        const fixture = detail?.[0];

        const homeTeam = match.home_team as Record<string, unknown> | null;
        const awayTeam = match.away_team as Record<string, unknown> | null;
        const league = match.league as Record<string, unknown> | null;

        const userPrompt = buildResultUserPrompt({
          homeTeam: (homeTeam?.name as string) || "Équipe A",
          awayTeam: (awayTeam?.name as string) || "Équipe B",
          homeScore: (match.score_home as number) || 0,
          awayScore: (match.score_away as number) || 0,
          competition: (league?.name as string) || "",
          date: (match.date as string) || new Date().toISOString(),
          events: (fixture?.events || []).map((e: Record<string, unknown>) => ({
            type: (e.type as string) || "",
            player: (e.player as string) || "",
            team: (e.team as string) || "",
            minute: (e.time as number) || 0,
          })),
          stats: {
            possession: [50, 50],
            shots: [0, 0],
            shotsOnTarget: [0, 0],
            corners: [0, 0],
            fouls: [0, 0],
          },
          standings: [],
        });

        const articleData = await generateArticle(
          RESULT_SYSTEM_PROMPT,
          userPrompt
        );

        if (!articleData) {
          console.error(`Failed to generate article for match ${match.id}`);
          continue;
        }

        const parsed = typeof articleData === "string" ? JSON.parse(articleData) : articleData;
        const slug = generateSlug(parsed.title || "article");

        const { error: insertError } = await supabase.from("articles").insert({
          title: parsed.title,
          slug,
          excerpt: parsed.excerpt,
          content: parsed.content,
          type: "result",
          match_id: match.id,
          league_id: match.league_id,
          seo_title: parsed.seo_title || parsed.title,
          seo_description: parsed.seo_description || parsed.excerpt,
          tags: parsed.tags || [],
          published_at: new Date().toISOString(),
        });

        if (insertError) {
          console.error("Error inserting article:", insertError);
        } else {
          articlesGenerated++;
        }
      } catch (err) {
        console.error(`Error generating article for match ${match.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      articles_generated: articlesGenerated,
      matches_processed: matchesWithoutArticles.length,
    });
  } catch (error) {
    console.error("Error in generate-articles cron:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
