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
    const currentYear = new Date().getFullYear();
    let leaguesUpdated = 0;

    for (const leagueId of LEAGUE_IDS) {
      try {
        const standingsResponse = await fetchStandings(leagueId, currentYear);

        if (!standingsResponse || !standingsResponse.length) continue;

        // API-Football returns standings as StandingsResponse[]
        // Each response has league.standings which is Standing[][]
        const leagueData = standingsResponse[0];
        if (!leagueData?.league?.standings) continue;

        const allGroups = leagueData.league.standings;

        for (const group of allGroups) {
          const standings = (group || []).map(
            (entry) => ({
              rank: entry.rank,
              team_name: entry.team.name,
              team_slug: entry.team.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, ""),
              team_api_id: entry.team.id,
              played: entry.all.played,
              won: entry.all.win,
              drawn: entry.all.draw,
              lost: entry.all.lose,
              goals_for: entry.all.goals.for,
              goals_against: entry.all.goals.against,
              goal_diff: entry.goalsDiff,
              points: entry.points,
            })
          );

          const groupName = group?.[0]?.group || "League";

          const { error } = await supabase.from("standings").upsert(
            {
              league_api_football_id: leagueId,
              season: currentYear,
              group_name: groupName,
              data_json: standings,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "league_api_football_id,season,group_name" }
          );

          if (error) {
            console.error(
              `Error upserting standings for league ${leagueId}:`,
              error
            );
          } else {
            leaguesUpdated++;
          }
        }
      } catch (err) {
        console.error(
          `Error fetching standings for league ${leagueId}:`,
          err
        );
      }
    }

    return NextResponse.json({
      success: true,
      leagues_updated: leaguesUpdated,
    });
  } catch (error) {
    console.error("Error in update-standings cron:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
