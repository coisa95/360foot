import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getTeamStatistics, getCoach, getCurrentSeason } from "@/lib/api-football";

export const maxDuration = 300;

/**
 * CRON: Fetch detailed team statistics and coach info.
 * Runs once daily. Rotates through teams in batches.
 */

// League IDs to fetch team stats for
const LEAGUE_IDS = [
  386, // Ligue 1 Côte d'Ivoire
  403, // Ligue 1 Sénégal
  411, // Elite One Cameroun
  598, // Première Division Mali
  423, // Ligue 1 Burkina Faso
  415, // Championnat National Bénin
  424, // Linafoot Ligue 1 RD Congo
  378, // Ligue 1 Guinée
  968, // Championnat D1 Gabon
  61,  // Ligue 1 France
  39,  // Premier League
  140, // La Liga
  135, // Serie A
  78,  // Bundesliga
  253, // MLS
  307, // Saudi Pro League
  12,  // CAF Champions League
  20,  // CAF Confederation Cup
  17,  // AFC Champions League
  16,  // CONCACAF Champions League
  13,  // Copa Libertadores
];

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();

    // Get teams that need stats updated (rotate daily)
    const { data: teams } = await supabase
      .from("teams")
      .select("id, api_football_id, league_id, league:leagues!league_id(api_football_id)")
      .not("api_football_id", "is", null)
      .order("created_at", { ascending: true })
      .limit(100);

    if (!teams || teams.length === 0) {
      return NextResponse.json({ success: true, message: "No teams found", updated: 0 });
    }

    // Select batch based on day of month
    const dayOfMonth = new Date().getDate();
    const batchSize = 6; // 6 teams per run (2 API calls each = 12 calls)
    const startIdx = ((dayOfMonth - 1) * batchSize) % teams.length;
    const batch = [];
    for (let j = 0; j < batchSize && j < teams.length; j++) {
      batch.push(teams[(startIdx + j) % teams.length]);
    }

    let updated = 0;
    const errors: string[] = [];
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    for (let i = 0; i < batch.length; i++) {
      const team = batch[i] as Record<string, unknown>;
      const teamApiId = team.api_football_id as number;
      const leagueData = team.league as Record<string, unknown> | null;
      const leagueApiId = leagueData?.api_football_id as number | null;

      if (!teamApiId || !leagueApiId) continue;
      if (!LEAGUE_IDS.includes(leagueApiId)) continue;

      if (i > 0) await delay(7000);

      try {
        const season = getCurrentSeason(leagueApiId);

        // 1. Fetch team statistics
        const stats = await getTeamStatistics(teamApiId, leagueApiId, season);

        await delay(7000);

        // 2. Fetch coach
        let coachData = null;
        try {
          const coaches = await getCoach(teamApiId);
          if (coaches && coaches.length > 0) {
            const coach = coaches[0];
            coachData = {
              name: coach.name,
              photo: coach.photo,
              nationality: coach.nationality,
              age: coach.age,
            };
          }
        } catch (err) {
          console.error(`Coach error for team ${teamApiId}:`, err);
        }

        // Format team stats
        const teamStats = stats ? {
          form: stats.form || "",
          fixtures: stats.fixtures || {},
          goals: stats.goals || {},
          biggest: stats.biggest || {},
          clean_sheet: stats.clean_sheet || {},
          failed_to_score: stats.failed_to_score || {},
          penalty: stats.penalty || {},
          lineups: stats.lineups || [],
        } : null;

        // Update team
        const updateData: Record<string, unknown> = {};
        if (teamStats) updateData.team_stats_json = teamStats;
        if (coachData) {
          updateData.coach = coachData.name;
          updateData.coach_photo = coachData.photo;
          updateData.coach_nationality = coachData.nationality;
        }

        if (Object.keys(updateData).length > 0) {
          const { error } = await supabase
            .from("teams")
            .update(updateData)
            .eq("id", team.id as string);

          if (error) {
            errors.push(`Team ${teamApiId}: ${error.message}`);
          } else {
            updated++;
          }
        }
      } catch (err) {
        errors.push(`Team ${teamApiId}: ${String(err)}`);
      }
    }

    return NextResponse.json({
      success: true,
      teams_updated: updated,
      batch_size: batch.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });
  } catch (error) {
    console.error("Error in fetch-team-stats cron:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
