import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getMatchDetails } from "@/lib/api-football";

export const maxDuration = 300;

/**
 * CRON: Enrich finished matches with events, statistics, and lineups.
 * Runs every hour. Fetches detailed data from API-Football for matches
 * that are finished (FT) but don't have events_json populated yet.
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();

    // Find finished matches without events data (last 7 days only)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: matches } = await supabase
      .from("matches")
      .select("id, api_football_id, slug, status")
      .eq("status", "FT")
      .is("events_json", null)
      .gte("date", sevenDaysAgo.toISOString())
      .order("date", { ascending: false })
      .limit(10); // Max 10 per run to respect API rate limits

    if (!matches || matches.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No matches to enrich",
        enriched: 0,
      });
    }

    let enriched = 0;
    const errors: string[] = [];
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      if (!match.api_football_id) continue;

      // Rate limit: wait between API calls
      if (i > 0) await delay(7000);

      try {
        const details = await getMatchDetails(match.api_football_id);
        if (!details || details.length === 0) continue;

        const fixture = details[0];

        // Extract events (goals, cards, substitutions)
        const events = (fixture.events || []).map((e) => ({
          minute: e.time.elapsed,
          extra: e.time.extra,
          type: e.type,
          detail: e.detail,
          player: e.player?.name || "",
          assist: e.assist?.name || null,
          team: e.team?.name || "",
          teamId: e.team?.id || null,
        }));

        // Extract statistics
        const statistics: Record<string, { home: number | string | null; away: number | string | null }> = {};
        if (fixture.statistics && fixture.statistics.length >= 2) {
          const homeStats = fixture.statistics[0]?.statistics || [];
          const awayStats = fixture.statistics[1]?.statistics || [];

          for (const stat of homeStats) {
            const key = stat.type;
            if (!statistics[key]) {
              statistics[key] = { home: null, away: null };
            }
            statistics[key].home = stat.value;
          }

          for (const stat of awayStats) {
            const key = stat.type;
            if (!statistics[key]) {
              statistics[key] = { home: null, away: null };
            }
            statistics[key].away = stat.value;
          }
        }

        // Extract lineups
        const lineups = (fixture.lineups || []).map((l) => ({
          team: l.team.name,
          teamId: l.team.id,
          formation: l.formation,
          coach: l.coach?.name || "",
          startXI: (l.startXI || []).map((p) => ({
            name: p.player.name,
            number: p.player.number,
            pos: p.player.pos,
          })),
          substitutes: (l.substitutes || []).map((p) => ({
            name: p.player.name,
            number: p.player.number,
            pos: p.player.pos,
          })),
        }));

        // Extract additional match info
        const matchInfo = {
          referee: fixture.fixture?.referee || null,
          venue: fixture.fixture?.venue?.name || null,
          city: fixture.fixture?.venue?.city || null,
          halftime: fixture.score?.halftime || null,
        };

        // Update match with enriched data
        const { error: updateError } = await supabase
          .from("matches")
          .update({
            events_json: events,
            lineups_json: lineups,
            stats_json: {
              ...(typeof match === "object" ? {} : {}),
              fixture: fixture.fixture,
              teams: fixture.teams,
              league: fixture.league,
              goals: fixture.goals,
              score: fixture.score,
              statistics,
              matchInfo,
            },
          })
          .eq("id", match.id);

        if (updateError) {
          errors.push(`${match.slug}: ${updateError.message}`);
        } else {
          enriched++;
          console.log(`Enriched match: ${match.slug}`);
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
    console.error("Error in enrich-matches cron:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
