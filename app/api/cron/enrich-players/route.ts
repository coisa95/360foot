import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getPlayerStats, getCurrentSeason } from "@/lib/api-football";
import { verifyCronAuth } from "@/lib/auth";


export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * CRON: Enrich players with detailed statistics from API-Football.
 * Processes 15 players per run that have api_football_id but no stats_json.
 */
export async function GET(request: Request) {
  try {
    if (!verifyCronAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();
    const season = getCurrentSeason();

    // Find players with api_football_id but no stats yet
    const { data: players } = await supabase
      .from("players")
      .select("id, name, api_football_id, team_id")
      .not("api_football_id", "is", null)
      .is("stats_json", null)
      .limit(30); // Doubled: VPS calls 4x/day

    if (!players || players.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No players to enrich",
        enriched: 0,
      });
    }

    let enriched = 0;
    const errors: string[] = [];
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      if (!player.api_football_id) continue;

      if (i > 0) await delay(3000);

      try {
        const stats = await getPlayerStats(player.api_football_id, season);
        if (!stats || stats.length === 0) {
          // Mark as processed with empty stats to avoid re-querying
          await supabase
            .from("players")
            .update({ stats_json: {} })
            .eq("id", player.id);
          continue;
        }

        const playerData = stats[0];

        // Aggregate stats across all leagues/competitions
        let totalAppearances = 0;
        let totalGoals = 0;
        let totalAssists = 0;
        let totalMinutes = 0;
        let totalYellowCards = 0;
        let totalRedCards = 0;
        let totalShots = 0;
        let totalShotsOn = 0;
        let totalPasses = 0;
        let totalKeyPasses = 0;
        let totalSaves = 0;
        let bestRating = "0";

        for (const s of playerData.statistics) {
          totalAppearances += s.games.appearances || 0;
          totalMinutes += s.games.minutes || 0;
          totalGoals += s.goals.total || 0;
          totalAssists += s.goals.assists || 0;
          totalSaves += s.goals.saves || 0;
          totalYellowCards += s.cards.yellow || 0;
          totalRedCards += s.cards.red || 0;
          totalShots += s.shots.total || 0;
          totalShotsOn += s.shots.on || 0;
          totalPasses += s.passes.total || 0;
          totalKeyPasses += s.passes.key || 0;
          if (s.games.rating && parseFloat(s.games.rating) > parseFloat(bestRating)) {
            bestRating = s.games.rating;
          }
        }

        const statsJson: Record<string, number | string> = {
          appearances: totalAppearances,
          goals: totalGoals,
          assists: totalAssists,
          minutes: totalMinutes,
          yellow_cards: totalYellowCards,
          red_cards: totalRedCards,
        };

        // Only include non-zero stats
        if (totalShots > 0) statsJson.shots = totalShots;
        if (totalShotsOn > 0) statsJson.shots_on_target = totalShotsOn;
        if (totalPasses > 0) statsJson.passes = totalPasses;
        if (totalKeyPasses > 0) statsJson.key_passes = totalKeyPasses;
        if (totalSaves > 0) statsJson.saves = totalSaves;
        if (parseFloat(bestRating) > 0) statsJson.rating = bestRating;

        const updateData: Record<string, unknown> = { stats_json: statsJson };

        const { error: updateError } = await supabase
          .from("players")
          .update(updateData)
          .eq("id", player.id);

        if (updateError) {
          errors.push(`${player.name}: ${updateError.message}`);
        } else {
          enriched++;
        }
      } catch (err) {
        errors.push(`${player.name}: ${String(err)}`);
      }
    }

    return NextResponse.json({
      success: true,
      enriched,
      total_candidates: players.length,
      season,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
    });
  } catch (error) {
    console.error("Error in enrich-players cron:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
