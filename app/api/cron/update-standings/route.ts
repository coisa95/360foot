import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getStandings as fetchStandings } from "@/lib/api-football";

const LEAGUE_IDS = [
  373, // Ligue 1 CI
  384, // Ligue Pro SN
  406, // Elite One CM
  394, // Primus Mali
  398, // Fasofoot BF
  61,  // Ligue 1 France
  39,  // Premier League
  140, // La Liga
  135, // Serie A
  2,   // Champions League
  3,   // Europa League
  6,   // CAN
];

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();

    // Free API plan: season 2024 only
    const currentSeason = 2024;

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
      if (i > 0) await delay(7000);
      try {
        const standingsResponse = await fetchStandings(leagueId, currentSeason);

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
          .eq("season", String(currentSeason));

        const { error } = await supabase.from("standings").insert({
          league_id: leagueUUID,
          season: String(currentSeason),
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
      season: currentSeason,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });
  } catch (error) {
    console.error("Error in update-standings cron:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
