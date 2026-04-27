import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { generateArticle } from "@/lib/llm";
import { verifyCronAuth } from "@/lib/auth";

export const maxDuration = 300;
import { getArticleImages, injectImagesIntoHTML, buildArticleOgUrl } from "@/lib/images";
import {
  systemPrompt as PREVIEW_SYSTEM_PROMPT,
  buildUserPrompt as buildPreviewUserPrompt,
} from "@/lib/prompts/preview-article";
import { publishToTelegram } from "@/lib/telegram";


export const dynamic = "force-dynamic";
/**
 * Normalise un champ `tags` venant du LLM en `string[]`.
 *
 * DeepSeek peut, malgré le prompt, renvoyer `tags` sous forme de chaîne CSV
 * ("psg, mbappé, ligue 1") au lieu d'un array. Postgres rejette alors
 * l'INSERT avec `22P02 malformed array literal` car la colonne est `text[]`.
 * On accepte donc string ou array et on retourne toujours un `string[]`.
 */
function normalizeTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === "string" && !!x.trim());
  }
  if (typeof raw === "string") {
    return raw
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

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
    if (!verifyCronAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();
    const today = new Date().toISOString().split("T")[0];
    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);
    const endDate = in3Days.toISOString().split("T")[0];

    // Find upcoming matches (next 3 days) with status NS or TBD
    const { data: scheduledMatches } = await supabase
      .from("matches")
      .select("*, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name), league:leagues(name)")
      .in("status", ["NS", "TBD"])
      .gte("date", `${today}T00:00:00`)
      .lte("date", `${endDate}T23:59:59`);

    // Get existing preview articles
    const { data: existingPreviews } = await supabase
      .from("articles")
      .select("match_id")
      .eq("type", "preview");

    const existingMatchIds = new Set(
      (existingPreviews || []).map((a: Record<string, unknown>) => a.match_id)
    );

    const matchesWithoutPreviews = (scheduledMatches || []).filter(
      (m: Record<string, unknown>) => !existingMatchIds.has(m.id)
    ).slice(0, 4); // Increased: VPS triggers 3x/hour

    let previewsGenerated = 0;

    for (const match of matchesWithoutPreviews) {
      try {
        const homeTeam = match.home_team as Record<string, unknown> | null;
        const awayTeam = match.away_team as Record<string, unknown> | null;
        const league = match.league as Record<string, unknown> | null;

        const userPrompt = buildPreviewUserPrompt({
          homeTeam: (homeTeam?.name as string) || "Équipe A",
          awayTeam: (awayTeam?.name as string) || "Équipe B",
          competition: (league?.name as string) || "",
          date: (match.date as string) || today,
          homeForm: [],
          awayForm: [],
          headToHead: [],
          standings: [],
        });

        const articleData = await generateArticle(
          PREVIEW_SYSTEM_PROMPT,
          userPrompt,
          "deepseek-chat",
          { jsonMode: true }
        );

        if (!articleData) {
          console.error(`Failed to generate preview for match ${match.id}`);
          continue;
        }

        let cleanData = articleData;
        if (typeof cleanData === "string") {
          cleanData = cleanData.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let parsed: any;
        try {
          parsed = JSON.parse(cleanData);
        } catch (parseErr) {
          console.error(
            `[LLM_PARSE_ERROR] preview match=${match.id} err=${String(parseErr)} ` +
              `head=${cleanData.slice(0, 200)}`
          );
          continue;
        }
        const slug = generateSlug(parsed.title || "preview");
        const tags = normalizeTags(parsed.tags);

        // Extract team logos from stats_json if available
        const statsJson = match.stats_json as Record<string, unknown> | null;
        const teamsData = statsJson?.teams as Record<string, Record<string, unknown>> | null;
        const homeTeamLogo = (teamsData?.home?.logo as string) || undefined;
        const awayTeamLogo = (teamsData?.away?.logo as string) || undefined;
        const leagueLogo = ((statsJson?.league as Record<string, unknown>)?.logo as string) || undefined;

        const leagueName = (league?.name as string) || "";
        const homeTeamName = (homeTeam?.name as string) || "";
        const awayTeamName = (awayTeam?.name as string) || "";

        // Fetch and inject images (using API-Football team logos)
        let contentWithImages = parsed.content;
        let ogImageUrl: string | null = null;
        try {
          const images = await getArticleImages({
            title: parsed.title,
            teams: [homeTeamName, awayTeamName],
            league: leagueName,
            type: "preview",
            tags,
            homeTeamLogo,
            awayTeamLogo,
            leagueLogo,
          });
          contentWithImages = injectImagesIntoHTML(parsed.content, images);
          ogImageUrl = buildArticleOgUrl({
            title: parsed.title,
            type: "preview",
            league: leagueName,
            homeTeamLogo,
            awayTeamLogo,
            leagueLogo,
          });
        } catch (imgErr) {
          console.error("Image injection failed:", imgErr);
          ogImageUrl = buildArticleOgUrl({
            title: parsed.title,
            type: "preview",
            league: leagueName,
          });
        }

        const { error: insertError } = await supabase.from("articles").insert({
          title: parsed.title,
          slug,
          excerpt: parsed.excerpt,
          content: contentWithImages,
          type: "preview",
          match_id: match.id,
          league_id: match.league_id,
          seo_title: parsed.seo_title || parsed.title,
          seo_description: parsed.seo_description || parsed.excerpt,
          og_image_url: ogImageUrl,
          tags,
          published_at: new Date().toISOString(),
        });

        if (insertError) {
          console.error("Error inserting preview:", insertError);
        } else {
          previewsGenerated++;
          await publishToTelegram({
            title: parsed.title,
            slug,
            excerpt: parsed.excerpt,
            type: "preview",
            imageUrl: ogImageUrl,
            tags,
          });
        }
      } catch (err) {
        console.error(`Error generating preview for match ${match.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      previews_generated: previewsGenerated,
      matches_processed: matchesWithoutPreviews.length,
    });
  } catch (error) {
    console.error("Error in generate-previews cron:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
