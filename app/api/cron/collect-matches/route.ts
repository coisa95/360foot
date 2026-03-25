import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getMatchesByRange } from "@/lib/api-football";

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

function generateSlug(home: string, away: string, date: string): string {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  return `${clean(home)}-vs-${clean(away)}-${date}`;
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();

    // Get matches from the last 7 days + next 7 days
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - 7);
    const to = new Date(now);
    to.setDate(to.getDate() + 7);
    const fromStr = from.toISOString().split("T")[0];
    const toStr = to.toISOString().split("T")[0];

    // Fetch all league UUID mappings from DB
    const { data: leagues } = await supabase
      .from("leagues")
      .select("id, api_football_id");

    const leagueMap = new Map<number, string>();
    for (const l of leagues || []) {
      if (l.api_football_id) leagueMap.set(l.api_football_id, l.id);
    }

    let totalMatches = 0;
    let totalTeamsUpserted = 0;
    const errors: string[] = [];

    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    for (let i = 0; i < LEAGUE_IDS.length; i++) {
      const leagueId = LEAGUE_IDS[i];

      // Respect rate limit: 10 requests/min → wait 7s between calls
      if (i > 0) await delay(7000);
      try {
        const matches = await getMatchesByRange(fromStr, toStr, leagueId);

        if (!matches || matches.length === 0) continue;

        const leagueUUID = leagueMap.get(leagueId);

        for (const match of matches) {
          const homeTeam = match.teams.home;
          const awayTeam = match.teams.away;

          // Upsert teams
          const teamsToUpsert = [
            {
              api_football_id: homeTeam.id,
              name: homeTeam.name,
              slug: homeTeam.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, ""),
              logo_url: homeTeam.logo,
              league_id: leagueUUID || null,
            },
            {
              api_football_id: awayTeam.id,
              name: awayTeam.name,
              slug: awayTeam.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, ""),
              logo_url: awayTeam.logo,
              league_id: leagueUUID || null,
            },
          ];

          const { error: teamError } = await supabase
            .from("teams")
            .upsert(teamsToUpsert, { onConflict: "api_football_id" });

          if (teamError) {
            errors.push(`Team upsert: ${teamError.message}`);
          } else {
            totalTeamsUpserted += teamsToUpsert.length;
          }

          // Get team UUIDs from DB
          const { data: homeTeamRow } = await supabase
            .from("teams")
            .select("id")
            .eq("api_football_id", homeTeam.id)
            .single();

          const { data: awayTeamRow } = await supabase
            .from("teams")
            .select("id")
            .eq("api_football_id", awayTeam.id)
            .single();

          const matchDate = match.fixture.date.split("T")[0];
          const slug = generateSlug(homeTeam.name, awayTeam.name, matchDate);

          // Upsert match with correct schema columns
          const matchData = {
            api_football_id: match.fixture.id,
            home_team_id: homeTeamRow?.id || null,
            away_team_id: awayTeamRow?.id || null,
            league_id: leagueUUID || null,
            slug,
            date: match.fixture.date,
            status: match.fixture.status.short,
            score_home: match.goals.home,
            score_away: match.goals.away,
            stats_json: match,
          };

          const { error: matchError } = await supabase
            .from("matches")
            .upsert(matchData, { onConflict: "api_football_id" });

          if (matchError) {
            errors.push(`Match ${slug}: ${matchError.message}`);
          } else {
            totalMatches++;
          }
        }
      } catch (err) {
        errors.push(`League ${leagueId}: ${String(err)}`);
      }
    }

    return NextResponse.json({
      success: true,
      matches_upserted: totalMatches,
      teams_upserted: totalTeamsUpserted,
      date_range: `${fromStr} to ${toStr}`,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });
  } catch (error) {
    console.error("Error in collect-matches cron:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
