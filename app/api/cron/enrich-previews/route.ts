import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getPredictions, getHeadToHead, getInjuries } from "@/lib/api-football";
import { verifyCronAuth } from "@/lib/auth";


export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * CRON: Enrich upcoming matches with predictions, H2H, and injuries.
 * Runs every hour. Fetches data for matches happening in the next 3 days.
 */
export async function GET(request: Request) {
  try {
    if (!verifyCronAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();

    // Find upcoming matches in the next 3 days without predictions
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const { data: matches } = await supabase
      .from("matches")
      .select("id, api_football_id, slug, home_team:teams!home_team_id(api_football_id, name), away_team:teams!away_team_id(api_football_id, name)")
      .eq("status", "NS")
      .is("predictions_json", null)
      .gte("date", now.toISOString())
      .lte("date", threeDaysFromNow.toISOString())
      .order("date", { ascending: true })
      .limit(15); // Increased: VPS calls every 15 min

    if (!matches || matches.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No upcoming matches to enrich",
        enriched: 0,
      });
    }

    let enriched = 0;
    const errors: string[] = [];
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i] as Record<string, unknown>;
      const apiFootballId = match.api_football_id as number | null;
      if (!apiFootballId) continue;

      if (i > 0) await delay(3000);

      try {
        // 1. Fetch predictions
        let predictionsData = null;
        try {
          const predictions = await getPredictions(apiFootballId);
          if (predictions && predictions.length > 0) {
            const pred = predictions[0];
            const rawWinner = pred.predictions?.winner;
            const rawGoals = pred.predictions?.goals;
            // Normalise winner: API-Football renvoie soit un string, soit
            // { id, name, comment }. On stocke un string "name" + le
            // commentaire à part pour éviter les crashs JSX qui tentent de
            // rendre un objet.
            const winnerName =
              typeof rawWinner === "string"
                ? rawWinner
                : (rawWinner && typeof rawWinner === "object"
                    ? (rawWinner as { name?: string }).name || null
                    : null);
            const winnerComment =
              rawWinner && typeof rawWinner === "object"
                ? (rawWinner as { comment?: string }).comment || null
                : null;
            // Normalise goals: soit string "X.X", soit { home, away }.
            const goalsStr =
              typeof rawGoals === "string"
                ? rawGoals
                : (rawGoals && typeof rawGoals === "object" &&
                    (rawGoals as { home?: unknown }).home != null
                      ? `${(rawGoals as { home?: unknown }).home} - ${(rawGoals as { away?: unknown }).away}`
                      : null);
            predictionsData = {
              winner: winnerName,
              winner_comment: winnerComment,
              advice: pred.predictions?.advice || "",
              percent: pred.predictions?.percent || {},
              goals: goalsStr,
              under_over: pred.predictions?.under_over || null,
              comparison: pred.comparison || {},
              home_form: pred.teams?.home?.last_5?.form || "",
              away_form: pred.teams?.away?.last_5?.form || "",
              // API-Football last_5.goals = { for: { total: N }, against: { total: M } }.
              // Coerce to a single number at write-time so JSX can render it
              // directly. Stored object caused "Objects are not valid as a
              // React child (keys {for, against})" crashes.
              home_goals_last5:
                (pred.teams?.home?.last_5?.goals?.for?.total as number | undefined) ?? null,
              away_goals_last5:
                (pred.teams?.away?.last_5?.goals?.for?.total as number | undefined) ?? null,
            };
          }
        } catch (err) {
          console.error(`Predictions error for ${match.slug}:`, err);
        }

        await delay(3000);

        // 2. Fetch H2H
        let h2hData = null;
        const homeTeam = match.home_team as Record<string, unknown> | null;
        const awayTeam = match.away_team as Record<string, unknown> | null;
        const homeApiId = homeTeam?.api_football_id as number | null;
        const awayApiId = awayTeam?.api_football_id as number | null;

        if (homeApiId && awayApiId) {
          try {
            const h2h = await getHeadToHead(homeApiId, awayApiId, 5);
            if (h2h && h2h.length > 0) {
              h2hData = h2h.map((m) => ({
                date: m.fixture.date,
                homeTeam: m.teams.home.name,
                awayTeam: m.teams.away.name,
                homeScore: m.goals.home,
                awayScore: m.goals.away,
                league: m.league.name,
              }));
            }
          } catch (err) {
            console.error(`H2H error for ${match.slug}:`, err);
          }
        }

        await delay(3000);

        // 3. Fetch injuries
        let injuriesData = null;
        try {
          const injuries = await getInjuries(apiFootballId);
          if (injuries && injuries.length > 0) {
            injuriesData = injuries.map((inj) => ({
              player: inj.player.name,
              team: inj.team.name,
              teamId: inj.team.id,
              type: inj.player.type,
              reason: inj.player.reason,
            }));
          }
        } catch (err) {
          console.error(`Injuries error for ${match.slug}:`, err);
        }

        // Update match with enriched data
        const updateData: Record<string, unknown> = {};
        if (predictionsData) updateData.predictions_json = predictionsData;
        if (h2hData) updateData.h2h_json = h2hData;
        if (injuriesData) updateData.injuries_json = injuriesData;

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from("matches")
            .update(updateData)
            .eq("id", match.id as string);

          if (updateError) {
            errors.push(`${match.slug}: ${updateError.message}`);
          } else {
            enriched++;
            console.log(`Enriched preview: ${match.slug}`);
          }
        }
      } catch (err) {
        errors.push(`${match.slug}: ${String(err)}`);
      }
    }

    return NextResponse.json({
      success: true,
      enriched,
      total_candidates: matches.length,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
    });
  } catch (error) {
    console.error("Error in enrich-previews cron:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
