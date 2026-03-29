import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getMatchDetails, getVenue } from "@/lib/api-football";

export const maxDuration = 300;
import { generateArticle } from "@/lib/claude";
import { getArticleImages, injectImagesIntoHTML, buildArticleOgUrl } from "@/lib/images";
import {
  systemPrompt as RESULT_SYSTEM_PROMPT,
  buildUserPrompt as buildResultUserPrompt,
} from "@/lib/prompts/result-article";
import { publishToTelegram } from "@/lib/telegram";

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

    // Find finished matches (only from the last 3 days to avoid stale articles)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const { data: finishedMatches } = await supabase
      .from("matches")
      .select("*, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name), league:leagues(name)")
      .eq("status", "FT")
      .gte("date", threeDaysAgo.toISOString());

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

        let cleanData = articleData;
        if (typeof cleanData === "string") {
          // Strip markdown code blocks if present
          cleanData = cleanData.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
        }
        const parsed = JSON.parse(cleanData);
        const slug = generateSlug(parsed.title || "article");

        // Extract team logos and league logo from API-Football fixture data
        const homeTeamLogo = fixture?.teams?.home?.logo;
        const awayTeamLogo = fixture?.teams?.away?.logo;
        const leagueLogo = fixture?.league?.logo;

        // Extract goal scorer photos from events
        const goalScorerPhotos: { name: string; photo: string; team: string }[] = [];
        if (fixture?.events) {
          for (const evt of fixture.events) {
            if (evt.type === "Goal" && evt.player?.name) {
              // Get player photo from lineups if available
              let playerPhoto = "";
              for (const lineup of fixture.lineups || []) {
                const allPlayers = [...(lineup.startXI || []), ...(lineup.substitutes || [])];
                const found = allPlayers.find(p => p.player?.id === evt.player?.id);
                if (found) {
                  // API-Football player photos follow this pattern
                  playerPhoto = `https://media.api-sports.io/football/players/${evt.player.id}.png`;
                  break;
                }
              }
              if (!playerPhoto && evt.player?.id) {
                playerPhoto = `https://media.api-sports.io/football/players/${evt.player.id}.png`;
              }
              if (playerPhoto) {
                goalScorerPhotos.push({
                  name: evt.player.name,
                  photo: playerPhoto,
                  team: evt.team?.name || "",
                });
              }
            }
          }
        }

        // Fetch venue photo from API-Football if venue ID available
        let venuePhotoUrl: string | undefined;
        let venueName: string | undefined;
        let venueCity: string | undefined;
        try {
          const venueId = fixture?.fixture?.venue?.id;
          if (venueId) {
            const venues = await getVenue(venueId);
            if (venues?.[0]?.image) {
              venuePhotoUrl = venues[0].image;
              venueName = venues[0].name;
              venueCity = venues[0].city;
              console.log(`Venue photo found for ${venueName}: ${venuePhotoUrl}`);
            }
          }
        } catch (venueErr) {
          console.warn("Venue photo fetch failed (non-blocking):", venueErr);
        }

        const leagueName = (league?.name as string) || "";
        const homeTeamName = (homeTeam?.name as string) || "";
        const awayTeamName = (awayTeam?.name as string) || "";

        // Fetch and inject images (API-Football data: venue photo, team logos, player photos)
        let contentWithImages = parsed.content;
        let ogImageUrl: string | null = null;
        try {
          const images = await getArticleImages({
            title: parsed.title,
            teams: [homeTeamName, awayTeamName],
            league: leagueName,
            type: "result",
            tags: parsed.tags || [],
            venuePhotoUrl,
            venueName,
            venueCity,
            homeTeamLogo,
            awayTeamLogo,
            leagueLogo,
            goalScorerPhotos: goalScorerPhotos.length > 0 ? goalScorerPhotos : undefined,
          });
          contentWithImages = injectImagesIntoHTML(parsed.content, images);
          // Use dedicated OG URL builder for og_image_url
          ogImageUrl = buildArticleOgUrl({
            title: parsed.title,
            type: "result",
            league: leagueName,
            homeTeamLogo,
            awayTeamLogo,
            leagueLogo,
            venuePhotoUrl,
          });
        } catch (imgErr) {
          console.error("Image injection failed:", imgErr);
          // Fallback OG URL
          ogImageUrl = buildArticleOgUrl({
            title: parsed.title,
            type: "result",
            league: leagueName,
          });
        }

        const { error: insertError } = await supabase.from("articles").insert({
          title: parsed.title,
          slug,
          excerpt: parsed.excerpt,
          content: contentWithImages,
          type: "result",
          match_id: match.id,
          league_id: match.league_id,
          seo_title: parsed.seo_title || parsed.title,
          seo_description: parsed.seo_description || parsed.excerpt,
          og_image_url: ogImageUrl,
          tags: parsed.tags || [],
          published_at: new Date().toISOString(),
        });

        if (insertError) {
          console.error("Error inserting article:", insertError);
        } else {
          articlesGenerated++;
          await publishToTelegram({
            title: parsed.title,
            slug,
            excerpt: parsed.excerpt,
            type: "result",
            imageUrl: ogImageUrl,
            tags: parsed.tags || [],
          });
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
