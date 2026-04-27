import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getStandings as fetchStandings, getCurrentSeason } from "@/lib/api-football";
import { verifyCronAuth } from "@/lib/auth";


export const dynamic = "force-dynamic";
export const maxDuration = 300;

const LEAGUE_IDS = [
  // Ligues africaines
  386, // Ligue 1 Côte d'Ivoire
  403, // Ligue 1 Sénégal
  411, // Elite One Cameroun
  598, // Première Division Mali
  423, // Ligue 1 Burkina Faso
  415, // Championnat National Bénin
  424, // Linafoot Ligue 1 RD Congo
  // Ligues européennes
  61,  // Ligue 1 France
  39,  // Premier League
  140, // La Liga
  135, // Serie A
  78,  // Bundesliga
  // Autres ligues majeures
  253, // MLS
  307, // Saudi Pro League
  // Compétitions continentales (clubs)
  2,   // Champions League (UEFA)
  3,   // Europa League (UEFA)
  848, // Conference League (UEFA)
  12,  // CAF Champions League
  20,  // CAF Confederation Cup
  17,  // AFC Champions League
  16,  // CONCACAF Champions League
  13,  // Copa Libertadores
  11,  // Copa Sudamericana
  // Compétitions internationales (sélections)
  // 6,   // CAN — Terminée (CAN 2025)
  29,  // Qualifs Coupe du Monde - Afrique
  32,  // Qualifs Coupe du Monde - Europe
  34,  // Qualifs Coupe du Monde - Amérique du Sud
];

export async function GET(request: Request) {
  try {
    if (!verifyCronAuth(request)) {
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

    let leaguesUpdated = 0;
    const errors: string[] = [];

    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    for (let i = 0; i < LEAGUE_IDS.length; i++) {
      const leagueId = LEAGUE_IDS[i];

      // Respect rate limit: 10 requests/min → wait 7s between calls
      if (i > 0) await delay(3000);
      try {
        const leagueSeason = getCurrentSeason(leagueId);
        const standingsResponse = await fetchStandings(leagueId, leagueSeason);

        if (!standingsResponse || !standingsResponse.length) continue;

        const leagueData = standingsResponse[0];
        if (!leagueData?.league?.standings) continue;

        const leagueUUID = leagueMap.get(leagueId);
        if (!leagueUUID) {
          errors.push(`No UUID found for league ${leagueId}`);
          continue;
        }

        const allGroups = leagueData.league.standings;

        // Combine all groups into one JSON
        const standingsData = allGroups.flatMap((group) =>
          (group || []).map((entry) => ({
            rank: entry.rank,
            team_name: entry.team.name,
            team_logo: entry.team.logo,
            team_api_id: entry.team.id,
            played: entry.all.played,
            won: entry.all.win,
            drawn: entry.all.draw,
            lost: entry.all.lose,
            goals_for: entry.all.goals.for,
            goals_against: entry.all.goals.against,
            goal_diff: entry.goalsDiff,
            points: entry.points,
            group: entry.group || "League",
            form: entry.form,
          }))
        );

        // Delete existing standings for this league/season, then insert new
        await supabase
          .from("standings")
          .delete()
          .eq("league_id", leagueUUID)
          .eq("season", String(leagueSeason));

        const { error } = await supabase.from("standings").insert({
          league_id: leagueUUID,
          season: String(leagueSeason),
          data_json: standingsData,
          updated_at: new Date().toISOString(),
        });

        if (error) {
          errors.push(`Standings league ${leagueId}: ${error.message}`);
        } else {
          leaguesUpdated++;
        }
      } catch (err) {
        errors.push(`League ${leagueId}: ${String(err)}`);
      }
    }

    return NextResponse.json({
      success: true,
      leagues_updated: leaguesUpdated,
      season: "2025-2026",
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });
  } catch (error) {
    console.error("Error in update-standings cron:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
