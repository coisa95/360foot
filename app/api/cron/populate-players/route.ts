import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getTeamSquad } from "@/lib/api-football";

export const maxDuration = 300;

const TEAMS_PER_RUN = 15;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();

    // Fetch all teams with an api_football_id
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, slug, api_football_id")
      .not("api_football_id", "is", null)
      .order("api_football_id", { ascending: true });

    if (teamsError) {
      return NextResponse.json(
        { error: "Failed to fetch teams", details: teamsError.message },
        { status: 500 }
      );
    }

    if (!teams || teams.length === 0) {
      return NextResponse.json({ success: true, message: "No teams with api_football_id found" });
    }

    // Rotate based on current hour to cover all teams over multiple runs
    const currentHour = new Date().getHours();
    const offset = (currentHour % Math.ceil(teams.length / TEAMS_PER_RUN)) * TEAMS_PER_RUN;
    const teamsToProcess = teams.slice(offset, offset + TEAMS_PER_RUN);

    if (teamsToProcess.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No teams to process in this rotation",
        total_teams: teams.length,
        offset,
      });
    }

    let totalPlayers = 0;
    const errors: string[] = [];
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // Fetch existing slugs to handle conflicts
    const { data: existingSlugs } = await supabase
      .from("players")
      .select("slug");
    const slugSet = new Set((existingSlugs || []).map((p) => p.slug));

    for (let i = 0; i < teamsToProcess.length; i++) {
      const team = teamsToProcess[i];

      // Respect rate limit: 10 requests/min -> wait 7s between calls
      if (i > 0) await delay(7000);

      try {
        const squadData = await getTeamSquad(team.api_football_id);

        if (!squadData || squadData.length === 0) continue;

        const squad = squadData[0];
        if (!squad.players || squad.players.length === 0) continue;

        for (const player of squad.players) {
          let slug = generateSlug(player.name);

          // Handle slug conflicts by appending team slug
          if (slugSet.has(slug)) {
            const teamSlug = team.slug || generateSlug(String(team.api_football_id));
            slug = `${slug}-${teamSlug}`;
          }

          const playerData = {
            name: player.name,
            slug,
            team_id: team.id,
            position: player.position,
            photo_url: player.photo,
            api_football_id: player.id,
            number: player.number,
          };

          const { error: upsertError } = await supabase
            .from("players")
            .upsert(playerData, { onConflict: "api_football_id" });

          if (upsertError) {
            // If slug conflict on upsert, try with team slug appended
            if (upsertError.message.includes("slug")) {
              const teamSlug = team.slug || generateSlug(String(team.api_football_id));
              playerData.slug = `${generateSlug(player.name)}-${teamSlug}`;

              const { error: retryError } = await supabase
                .from("players")
                .upsert(playerData, { onConflict: "api_football_id" });

              if (retryError) {
                errors.push(`Player ${player.name}: ${retryError.message}`);
                continue;
              }
            } else {
              errors.push(`Player ${player.name}: ${upsertError.message}`);
              continue;
            }
          }

          slugSet.add(playerData.slug);
          totalPlayers++;
        }
      } catch (err) {
        errors.push(`Team ${team.api_football_id}: ${String(err)}`);
      }
    }

    return NextResponse.json({
      success: true,
      players_synced: totalPlayers,
      teams_processed: teamsToProcess.length,
      total_teams: teams.length,
      offset,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });
  } catch (error) {
    console.error("Error in populate-players cron:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
