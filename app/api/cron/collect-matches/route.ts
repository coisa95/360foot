import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getMatches } from "@/lib/api-football";

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
    const today = new Date().toISOString().split("T")[0];

    let totalMatches = 0;
    let totalTeamsUpserted = 0;

    for (const leagueId of LEAGUE_IDS) {
      const matches = await getMatches(today, leagueId);

      if (!matches || matches.length === 0) continue;

      for (const match of matches) {
        const homeTeam = match.teams.home;
        const awayTeam = match.teams.away;

        // Upsert teams
        const teamsToUpsert = [
          {
            api_football_id: homeTeam.id,
            name: homeTeam.name,
            slug: homeTeam.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
            logo_url: homeTeam.logo,
          },
          {
            api_football_id: awayTeam.id,
            name: awayTeam.name,
            slug: awayTeam.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
            logo_url: awayTeam.logo,
          },
        ];

        const { error: teamError } = await supabase
          .from("teams")
          .upsert(teamsToUpsert, { onConflict: "api_football_id" });

        if (teamError) {
          console.error("Error upserting teams:", teamError);
        } else {
          totalTeamsUpserted += teamsToUpsert.length;
        }

        // Upsert match
        const matchData = {
          api_football_id: match.fixture.id,
          league_id: leagueId,
          home_team_api_id: homeTeam.id,
          away_team_api_id: awayTeam.id,
          home_team_name: homeTeam.name,
          away_team_name: awayTeam.name,
          home_team_logo: homeTeam.logo,
          away_team_logo: awayTeam.logo,
          home_score: match.goals.home,
          away_score: match.goals.away,
          status: match.fixture.status.short,
          kickoff: match.fixture.date,
          venue: match.fixture.venue?.name || null,
          round: match.league.round,
          season: match.league.season,
          data_json: match,
        };

        const { error: matchError } = await supabase
          .from("matches")
          .upsert(matchData, { onConflict: "api_football_id" });

        if (matchError) {
          console.error("Error upserting match:", matchError);
        } else {
          totalMatches++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      matches_upserted: totalMatches,
      teams_upserted: totalTeamsUpserted,
      date: today,
    });
  } catch (error) {
    console.error("Error in collect-matches cron:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
