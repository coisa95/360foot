import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { verifyCronAuth } from "@/lib/auth";

export const maxDuration = 300;
export const dynamic = "force-dynamic";
import {
  getClubPlayers,
  getPlayerTransfers,
  parseMarketValue,
  formatMarketValue,
  type TmTransfer,
} from "@/lib/transfermarkt";

/**
 * CRON: Sync transfers from Transfermarkt API
 * Runs 2x/day — fetches recent transfers for monitored clubs
 * and enriches our transfers + players tables.
 */

// Transfermarkt club IDs for our monitored teams
const MONITORED_CLUBS: { tmId: string; name: string }[] = [
  // African clubs
  { tmId: "8571", name: "ASEC Mimosas" },
  { tmId: "24498", name: "Africa Sports" },
  // European clubs with African players
  { tmId: "583", name: "PSG" },
  { tmId: "418", name: "Real Madrid" },
  { tmId: "131", name: "FC Barcelona" },
  { tmId: "985", name: "Manchester United" },
  { tmId: "31", name: "Liverpool" },
  { tmId: "11", name: "Arsenal" },
  { tmId: "281", name: "Manchester City" },
  { tmId: "5", name: "AC Milan" },
  { tmId: "506", name: "Juventus" },
  { tmId: "27", name: "Bayern Munich" },
  { tmId: "1041", name: "Olympique Lyonnais" },
  { tmId: "244", name: "Olympique Marseille" },
  { tmId: "1082", name: "LOSC Lille" },
  { tmId: "13", name: "Atlético Madrid" },
  { tmId: "148", name: "Tottenham" },
  { tmId: "631", name: "Chelsea" },
  { tmId: "16", name: "Borussia Dortmund" },
  { tmId: "6195", name: "SSC Napoli" },
];

export async function GET(request: Request) {
  try {
    if (!verifyCronAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();
    let transfersSynced = 0;
    let playersSynced = 0;
    const errors: string[] = [];

    // Process 5 clubs per run (rotate based on hour)
    const batchSize = 5;
    const currentHour = new Date().getUTCHours();
    const batchIndex = Math.floor(currentHour / 12) % Math.ceil(MONITORED_CLUBS.length / batchSize);
    const batch = MONITORED_CLUBS.slice(
      batchIndex * batchSize,
      (batchIndex + 1) * batchSize
    );

    for (const club of batch) {
      try {
        // 1. Fetch club roster with market values
        const rosterData = await getClubPlayers(club.tmId);
        if (!rosterData?.players) continue;

        for (const player of rosterData.players.slice(0, 30)) {
          try {
            // Rate limit: 1 req/sec is handled by the client

            // 2. Try to match player to our DB
            const { data: existingPlayer } = await supabase
              .from("players")
              .select("id, slug, transfermarkt_id")
              .ilike("name", `%${player.name.split(" ").pop()}%`)
              .limit(1)
              .maybeSingle();

            // 3. Enrich player if found
            if (existingPlayer) {
              const mvNum = parseMarketValue(player.marketValue);
              const updateData: Record<string, unknown> = {
                market_value: player.marketValue || null,
                market_value_num: mvNum,
                transfermarkt_id: player.id,
              };
              if (player.dateOfBirth) updateData.birth_date = player.dateOfBirth;
              if (player.height) updateData.height = player.height;
              if (player.foot) updateData.foot = player.foot;
              if (player.shirtNumber) updateData.number = parseInt(player.shirtNumber);

              await supabase
                .from("players")
                .update(updateData)
                .eq("id", existingPlayer.id);

              // Save mapping
              await supabase.from("player_id_mapping").upsert(
                {
                  transfermarkt_id: player.id,
                  player_slug: existingPlayer.slug,
                  name: player.name,
                },
                { onConflict: "transfermarkt_id" }
              );

              playersSynced++;
            }

            // 4. Fetch player transfers
            const transfersData = await getPlayerTransfers(player.id);
            if (!transfersData?.transfers) continue;

            // Only process recent transfers (last 60 days)
            const sixtyDaysAgo = new Date();
            sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

            for (const transfer of transfersData.transfers) {
              const transferDate = new Date(transfer.date);
              if (transferDate < sixtyDaysAgo) continue;

              // Check if transfer already exists
              const { data: existing } = await supabase
                .from("transfers")
                .select("id")
                .eq("player_name", player.name)
                .eq("date", transfer.date)
                .maybeSingle();

              if (existing) continue;

              // Parse fee
              const feeStr = parseFee(transfer);

              await supabase.from("transfers").insert({
                player_name: player.name,
                from_team: transfer.from.clubName,
                to_team: transfer.to.clubName,
                transfer_type: transfer.isLoan ? "Loan" : feeStr === "Libre" ? "Free" : "N/A",
                fee: feeStr,
                date: transfer.date,
                player_photo: player.imageURL || null,
                player_nationality: player.nationality?.[0] || null,
                player_position: player.position || null,
                player_age: player.age ? parseInt(player.age) : null,
                market_value: player.marketValue || null,
                from_team_logo: transfer.from.clubImage || null,
                to_team_logo: transfer.to.clubImage || null,
                transfermarkt_player_id: player.id,
              });

              transfersSynced++;
            }
          } catch (playerErr) {
            errors.push(`Player ${player.name}: ${String(playerErr).slice(0, 100)}`);
          }
        }
      } catch (clubErr) {
        errors.push(`Club ${club.name}: ${String(clubErr).slice(0, 100)}`);
      }
    }

    return NextResponse.json({
      success: true,
      transfers_synced: transfersSynced,
      players_synced: playersSynced,
      batch: batch.map((c) => c.name).join(", "),
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
    });
  } catch (error) {
    console.error("Error in sync-transfers cron:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function parseFee(transfer: TmTransfer): string {
  if (transfer.isLoan) return "Prêt";
  if (!transfer.fee) return "Non communiqué";
  if (transfer.fee === "free transfer" || transfer.fee === "Free Transfer") return "Libre";
  if (transfer.fee === "-") return "Non communiqué";
  // Parse actual amount
  const value = parseMarketValue(transfer.fee);
  if (value > 0) return formatMarketValue(value);
  return transfer.fee;
}
