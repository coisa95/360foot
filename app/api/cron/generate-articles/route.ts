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
    ).slice(0, 3); // Limit to 3 per execution to avoid Vercel timeout

    let articlesGenerated = 0;
    const errors: string[] = [];

    for (const match of matchesWithoutArticles) {
      try {
        const detail = match.api_football_id
          ? await getMatchDetails(match.api_football_id as number)
          : null;
        const fixture = detail?.[0];

        const homeTeam = match.home_team as Record<string, unknown> | null;
        const awayTeam = match.away_team as Record<string, unknown> | null;
        const league = match.league as Record<string, unknown> | null;

        // Extract events from fixture details
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const events = (fixture?.events || []).map((e: any) => ({
          type: e.type === "Goal" ? "goal" : e.type?.toLowerCase() || "",
          player: e.player?.name || "",
          team: e.team?.name || "",
          minute: e.time?.elapsed || 0,
          detail: e.detail || "",
        }));

        // Extract stats from fixture details
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fixtureStats = fixture?.statistics || [];
        const getStatValue = (teamIdx: number, statType: string): number => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const teamStats = fixtureStats[teamIdx]?.statistics || [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const stat = teamStats.find((s: any) => s.type === statType);
          if (!stat?.value) return 0;
          const val = String(stat.value).replace("%", "");
          return parseInt(val) || 0;
        };

        const userPrompt = buildResultUserPrompt({
          homeTeam: (homeTeam?.name as string) || "Équipe A",
          awayTeam: (awayTeam?.name as string) || "Équipe B",
          homeScore: (match.score_home as number) || 0,
          awayScore: (match.score_away as number) || 0,
          competition: (league?.name as string) || "",
          date: (match.date as string) || new Date().toISOString(),
          events,
          stats: {
            possession: [getStatValue(0, "Ball Possession"), getStatValue(1, "Ball Possession")],
            shots: [getStatValue(0, "Total Shots"), getStatValue(1, "Total Shots")],
            shotsOnTarget: [getStatValue(0, "Shots on Goal"), getStatValue(1, "Shots on Goal")],
            corners: [getStatValue(0, "Corner Kicks"), getStatValue(1, "Corner Kicks")],
            fouls: [getStatValue(0, "Fouls"), getStatValue(1, "Fouls")],
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
        const errMsg = `Match ${match.id}: ${String(err)}`;
        console.error(errMsg);
        errors.push(errMsg);
      }
    }

    return NextResponse.json({
      success: true,
      articles_generated: articlesGenerated,
      matches_processed: matchesWithoutArticles.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error in generate-articles cron:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
