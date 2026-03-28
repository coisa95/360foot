import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getTopScorers, getTopAssists, getTopYellowCards, getTopRedCards, getCurrentSeason } from "@/lib/api-football";

export const maxDuration = 300;

/**
 * CRON: Fetch top scorers and top assists for each league.
 * Runs once daily. Stores data in standings table alongside standings data.
 */

// Only domestic leagues that have top scorers/assists data
const LEAGUE_IDS = [
  386, // Ligue 1 Côte d'Ivoire
  403, // Ligue 1 Sénégal
  411, // Elite One Cameroun
  598, // Première Division Mali
  423, // Ligue 1 Burkina Faso
  415, // Championnat National Bénin
  424, // Linafoot Ligue 1 RD Congo
  61,  // Ligue 1 France
  39,  // Premier League
  140, // La Liga
  135, // Serie A
  78,  // Bundesliga
  253, // MLS
  307, // Saudi Pro League
  2,   // Champions League
  3,   // Europa League
];

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();

    // Get league UUID mappings
    const { data: leagues } = await supabase
      .from("leagues")
      .select("id, api_football_id");

    const leagueMap = new Map<number, string>();
    for (const l of leagues || []) {
      if (l.api_football_id) leagueMap.set(l.api_football_id, l.id);
    }

    let updated = 0;
    const errors: string[] = [];
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    for (let i = 0; i < LEAGUE_IDS.length; i++) {
      const leagueId = LEAGUE_IDS[i];
      const leagueUUID = leagueMap.get(leagueId);
      if (!leagueUUID) continue;

      // Rate limit: 4 calls per league (scorers + assists + yellow + red), wait 7s between
      if (i > 0) await delay(4000);

      try {
        const season = getCurrentSeason(leagueId);

        // Fetch top scorers
        const scorers = await getTopScorers(leagueId, season);
        await delay(4000);

        // Fetch top assists
        const assists = await getTopAssists(leagueId, season);
        await delay(4000);

        // Fetch top yellow cards
        const yellowCards = await getTopYellowCards(leagueId, season);
        await delay(4000);

        // Fetch top red cards
        const redCards = await getTopRedCards(leagueId, season);

        // Format helper
        const formatPlayer = (p: typeof scorers[0]) => ({
          name: p.player.name,
          photo: p.player.photo,
          nationality: p.player.nationality,
          team: p.statistics[0]?.team?.name || "",
          teamLogo: p.statistics[0]?.team?.logo || "",
          goals: p.statistics[0]?.goals?.total || 0,
          assists: p.statistics[0]?.goals?.assists || 0,
          appearances: p.statistics[0]?.games?.appearances || 0,
          rating: p.statistics[0]?.games?.rating || null,
          yellowCards: p.statistics[0]?.cards?.yellow || 0,
          redCards: p.statistics[0]?.cards?.red || 0,
        });

        const topScorers = (scorers || []).slice(0, 10).map(formatPlayer);
        const topAssists = (assists || []).slice(0, 10).map(formatPlayer);
        const topYellowCards = (yellowCards || []).slice(0, 10).map(formatPlayer);
        const topRedCards = (redCards || []).slice(0, 10).map(formatPlayer);

        // Update standings row
        const { error } = await supabase
          .from("standings")
          .update({
            top_scorers_json: topScorers,
            top_assists_json: topAssists,
            top_yellow_cards_json: topYellowCards,
            top_red_cards_json: topRedCards,
          })
          .eq("league_id", leagueUUID)
          .eq("season", String(season));

        if (error) {
          errors.push(`League ${leagueId}: ${error.message}`);
        } else {
          updated++;
          console.log(`Updated top players for league ${leagueId}: ${topScorers.length} scorers, ${topAssists.length} assists, ${topYellowCards.length} yellow, ${topRedCards.length} red`);
        }
      } catch (err) {
        errors.push(`League ${leagueId}: ${String(err)}`);
      }
    }

    return NextResponse.json({
      success: true,
      leagues_updated: updated,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });
  } catch (error) {
    console.error("Error in fetch-top-players cron:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
