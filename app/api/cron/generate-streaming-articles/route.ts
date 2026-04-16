/**
 * Cron : génère des articles "streaming" pour les matchs à fort potentiel SEO.
 *
 * Stratégie : J-2 à J-1, on cible les matchs de compétitions à forte
 * intention commerciale (UCL, Europa, CAN, LdC CAF, Top 5 européen…) qui
 * n'ont pas encore d'article de type "streaming".
 *
 * Auth : même cron secret que les autres routes.
 * Cadence recommandée : 4 déclenchements / heure (comme generate-articles).
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { verifyCronAuth } from "@/lib/auth";
import { generateArticle } from "@/lib/claude";
import { getArticleImages, injectImagesIntoHTML, buildArticleOgUrl } from "@/lib/images";
import {
  systemPrompt as STREAMING_SYSTEM_PROMPT,
  buildUserPrompt as buildStreamingUserPrompt,
} from "@/lib/prompts/streaming-article";
import {
  getBroadcasters,
  isAfricanCompetition,
} from "@/lib/broadcasters/mapping";
import { publishToTelegram } from "@/lib/telegram";

export const maxDuration = 300;

// ──────────────────────────────────────────────────────────────────────────────
// Compétitions éligibles — fort potentiel SEO "comment regarder / streaming"
// ──────────────────────────────────────────────────────────────────────────────
const ELIGIBLE_COMPETITION_PATTERNS: RegExp[] = [
  // Europe
  /champions league|uefa.*champions/i,
  /europa league/i,
  /conference league/i,
  /premier league/i,
  /la liga|laliga/i,
  /serie a/i,
  /bundesliga/i,
  /\bligue 1\b/i,
  // Afrique
  /caf.*champions/i,
  /caf.*conf/i,
  /africa.*cup.*nations|afcon/i,
  /world cup.*qualif.*africa|qualif.*africa/i,
  /botola/i,
  // International
  /world cup/i,
  /euro championship/i,
];

const EXCLUDED_COMPETITION_PATTERNS: RegExp[] = [
  /f[ée]minin/i,
  /feminine/i,
  /dames/i,
  /women/i,
  /\bu-?\d{2}\b/i,      // U15, U-17, U20…
  /moins de \d{2}/i,
  /cadet|junior|scolaire/i,
];

function isEligibleCompetition(name: string): boolean {
  // Exclure féminin, jeunes, scolaire
  if (EXCLUDED_COMPETITION_PATTERNS.some((rx) => rx.test(name))) return false;
  return ELIGIBLE_COMPETITION_PATTERNS.some((rx) => rx.test(name));
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

function formatKickoff(dateIso: string): string {
  const d = new Date(dateIso);
  // Heure GMT (Dakar / Abidjan)
  const gmt = d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
  return `${gmt} GMT`;
}

export async function GET(request: Request) {
  try {
    if (!verifyCronAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();

    // Fenêtre : J à J+2 (on publie 24-48h avant le match pour capter la recherche)
    const now = new Date();
    const in2Days = new Date();
    in2Days.setDate(in2Days.getDate() + 2);
    const today = now.toISOString();
    const endDate = in2Days.toISOString();

    const { data: scheduledMatches } = await supabase
      .from("matches")
      .select(
        "*, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name), league:leagues(name)"
      )
      .in("status", ["NS", "TBD"])
      .gte("date", today)
      .lte("date", endDate)
      .order("date", { ascending: true });

    // Filtrage compétitions éligibles
    const eligibleMatches = (scheduledMatches || []).filter(
      (m: Record<string, unknown>) => {
        const league = m.league as Record<string, unknown> | null;
        const competitionName = (league?.name as string) || "";
        return isEligibleCompetition(competitionName);
      }
    );

    // Exclure matchs ayant déjà un article streaming
    const { data: existingStreamings } = await supabase
      .from("articles")
      .select("match_id")
      .eq("type", "streaming");

    const existingMatchIds = new Set(
      (existingStreamings || []).map((a: Record<string, unknown>) => a.match_id)
    );

    const matchesToProcess = eligibleMatches
      .filter((m: Record<string, unknown>) => !existingMatchIds.has(m.id))
      .slice(0, 4);

    let articlesGenerated = 0;
    const errors: string[] = [];

    for (const match of matchesToProcess) {
      try {
        const homeTeam = match.home_team as Record<string, unknown> | null;
        const awayTeam = match.away_team as Record<string, unknown> | null;
        const league = match.league as Record<string, unknown> | null;

        const homeTeamName = (homeTeam?.name as string) || "Équipe A";
        const awayTeamName = (awayTeam?.name as string) || "Équipe B";
        const competitionName = (league?.name as string) || "";
        const dateIso = (match.date as string) || today;

        // Logos depuis stats_json (même pattern que generate-previews)
        const statsJson = match.stats_json as Record<string, unknown> | null;
        const teamsData = statsJson?.teams as Record<string, Record<string, unknown>> | null;
        const homeTeamLogo = (teamsData?.home?.logo as string) || undefined;
        const awayTeamLogo = (teamsData?.away?.logo as string) || undefined;
        const leagueLogo =
          ((statsJson?.league as Record<string, unknown>)?.logo as string) || undefined;

        const venueData = statsJson?.venue as Record<string, unknown> | null;
        const venueName = (venueData?.name as string) || undefined;
        const venueCity = (venueData?.city as string) || undefined;

        // Diffuseurs
        const bc = getBroadcasters(competitionName);
        const africanFlag = isAfricanCompetition(competitionName);

        const userPrompt = buildStreamingUserPrompt({
          homeTeam: homeTeamName,
          awayTeam: awayTeamName,
          competition: competitionName,
          date: dateIso,
          kickoff: formatKickoff(dateIso),
          venue: venueName,
          city: venueCity,
          freeAfrica: bc.freeAfrica,
          foreignFree: bc.foreignFree,
          paid: bc.paid,
          broadcastNote: bc.note,
          isAfricanCompetition: africanFlag,
        });

        const articleData = await generateArticle(
          STREAMING_SYSTEM_PROMPT,
          userPrompt
        );

        if (!articleData) {
          errors.push(`Failed to generate streaming article for match ${match.id}`);
          continue;
        }

        let cleanData = articleData;
        if (typeof cleanData === "string") {
          cleanData = cleanData
            .replace(/^```(?:json)?\s*\n?/i, "")
            .replace(/\n?```\s*$/i, "")
            .trim();
        }
        const parsed = JSON.parse(cleanData);
        const slug = generateSlug(parsed.title || "streaming");

        // Images + OG
        let contentWithImages = parsed.content;
        let ogImageUrl: string | null = null;
        try {
          const images = await getArticleImages({
            title: parsed.title,
            teams: [homeTeamName, awayTeamName],
            league: competitionName,
            type: "preview",
            tags: parsed.tags || [],
            homeTeamLogo,
            awayTeamLogo,
            leagueLogo,
          });
          contentWithImages = injectImagesIntoHTML(parsed.content, images);
          ogImageUrl = buildArticleOgUrl({
            title: parsed.title,
            type: "preview",
            league: competitionName,
            homeTeamLogo,
            awayTeamLogo,
            leagueLogo,
          });
        } catch (imgErr) {
          console.error("Streaming image injection failed:", imgErr);
          ogImageUrl = buildArticleOgUrl({
            title: parsed.title,
            type: "preview",
            league: competitionName,
          });
        }

        const { error: insertError } = await supabase.from("articles").insert({
          title: parsed.title,
          slug,
          excerpt: parsed.excerpt,
          content: contentWithImages,
          type: "streaming",
          match_id: match.id,
          league_id: match.league_id,
          seo_title: parsed.seo_title || parsed.title,
          seo_description: parsed.seo_description || parsed.excerpt,
          og_image_url: ogImageUrl,
          tags: parsed.tags || [],
          published_at: new Date().toISOString(),
        });

        if (insertError) {
          errors.push(`Insert error for match ${match.id}: ${insertError.message}`);
          continue;
        }

        articlesGenerated++;

        await publishToTelegram({
          title: parsed.title,
          slug,
          excerpt: parsed.excerpt,
          type: "streaming",
          imageUrl: ogImageUrl,
          tags: parsed.tags || [],
        });
      } catch (err) {
        const msg = `Match ${match.id}: ${String(err)}`;
        console.error(msg);
        errors.push(msg);
      }
    }

    return NextResponse.json({
      success: true,
      articles_generated: articlesGenerated,
      matches_processed: matchesToProcess.length,
      matches_eligible_total: eligibleMatches.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error in generate-streaming-articles cron:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
