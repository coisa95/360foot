import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getTransfers } from "@/lib/api-football";
import { verifyCronAuth } from "@/lib/auth";

export const maxDuration = 300;

/**
 * CRON: Sync transfers from API-Football as backup for Transfermarkt.
 * Processes 5 teams per run, rotating based on hour.
 * Fetches recent transfers and stores them in the transfers table.
 */
export async function GET(request: Request) {
  try {
    if (!verifyCronAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();

    // Get teams with api_football_id
    const { data: allTeams } = await supabase
      .from("teams")
      .select("id, name, slug, api_football_id, logo_url")
      .not("api_football_id", "is", null)
      .order("name");

    if (!allTeams || allTeams.length === 0) {
      return NextResponse.json({ success: true, message: "No teams", transfers_synced: 0 });
    }

    // Process 5 teams per run, rotating
    const batchSize = 5;
    const currentHour = new Date().getUTCHours();
    const batchIndex = currentHour % Math.ceil(allTeams.length / batchSize);
    const batch = allTeams.slice(batchIndex * batchSize, (batchIndex + 1) * batchSize);

    let transfersSynced = 0;
    const errors: string[] = [];
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // Only keep transfers from the last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    for (let i = 0; i < batch.length; i++) {
      const team = batch[i];
      if (i > 0) await delay(7000);

      try {
        const transfersData = await getTransfers(team.api_football_id);
        if (!transfersData || transfersData.length === 0) continue;

        for (const entry of transfersData) {
          for (const transfer of entry.transfers) {
            const transferDate = new Date(transfer.date);
            if (transferDate < ninetyDaysAgo) continue;

            // Check if already exists
            const { data: existing } = await supabase
              .from("transfers")
              .select("id")
              .eq("player_name", entry.player.name)
              .eq("date", transfer.date)
              .maybeSingle();

            if (existing) continue;

            // Determine fee display
            let fee = "Non communiqué";
            if (transfer.type === "Free") fee = "Libre";
            else if (transfer.type === "Loan") fee = "Prêt";
            else if (transfer.type && transfer.type !== "N/A") fee = transfer.type;

            await supabase.from("transfers").insert({
              player_name: entry.player.name,
              from_team: transfer.teams.out.name,
              to_team: transfer.teams.in.name,
              transfer_type: transfer.type === "Free" ? "Free" : transfer.type === "Loan" ? "Loan" : "N/A",
              fee,
              date: transfer.date,
              from_team_logo: transfer.teams.out.logo || null,
              to_team_logo: transfer.teams.in.logo || null,
              api_football_player_id: entry.player.id,
            });

            transfersSynced++;
          }
        }
      } catch (err) {
        errors.push(`Team ${team.name}: ${String(err).slice(0, 100)}`);
      }
    }

    return NextResponse.json({
      success: true,
      transfers_synced: transfersSynced,
      teams_processed: batch.length,
      batch_index: batchIndex,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
    });
  } catch (error) {
    console.error("Error in sync-transfers-apifb cron:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
