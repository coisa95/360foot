import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { generateArticle } from "@/lib/claude";
import {
  systemPrompt as TRANSFER_SYSTEM_PROMPT,
  buildUserPrompt as buildTransferUserPrompt,
} from "@/lib/prompts/transfer-article";

const API_FOOTBALL_BASE = "https://v3.football.api-sports.io";

interface TransferEntry {
  player: { id: number; name: string };
  update: string;
  transfers: Array<{
    date: string;
    type: string;
    teams: {
      in: { id: number; name: string; logo: string };
      out: { id: number; name: string; logo: string };
    };
  }>;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[àâä]/g, "a")
    .replace(/[éèêë]/g, "e")
    .replace(/[ïî]/g, "i")
    .replace(/[ôö]/g, "o")
    .replace(/[ùûü]/g, "u")
    .replace(/[ç]/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function fetchTransfers(teamId: number): Promise<TransferEntry[]> {
  const res = await fetch(`${API_FOOTBALL_BASE}/transfers?team=${teamId}`, {
    headers: {
      "x-apisports-key": process.env.API_FOOTBALL_KEY || "",
    },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.response || [];
}

// African team IDs to monitor for transfers
const MONITORED_TEAM_IDS: number[] = [
  // Ligue 1 Côte d'Ivoire
  4512, // ASEC Mimosas
  4521, // San-Pédro
  4525, // Stade d'Abidjan
  4520, // SOA
  4519, // Racing d'Abidjan
  // Ligue Pro Sénégal
  5289, // Jaraaf
  5296, // Teungueth
  5285, // Casa Sport
  5288, // Génération Foot
  // Elite One Cameroun
  5401, // Cotonsport
  5560, // Canon Yaoundé
  5413, // Union Douala
  // Grands clubs européens (joueurs africains)
  85,   // PSG
  541,  // Real Madrid
  529,  // Barcelona
  33,   // Manchester United
  40,   // Liverpool
  42,   // Arsenal
  50,   // Manchester City
  489,  // AC Milan
  496,  // Juventus
  157,  // Bayern Munich
  80,   // Lyon
  81,   // Marseille
  79,   // Lille
  94,   // Villarreal
  530,  // Atletico Madrid
  47,   // Tottenham
  49,   // Chelsea
  165,  // Borussia Dortmund
  492,  // Napoli
  487,  // Lazio
];

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();
    let transfersUpserted = 0;
    let articlesGenerated = 0;
    const errors: string[] = [];

    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // Rotate through teams: process 8 per run based on current hour
    const batchSize = 8;
    const currentHour = new Date().getUTCHours();
    const batchIndex = Math.floor(currentHour / 6) % Math.ceil(MONITORED_TEAM_IDS.length / batchSize);
    const startIdx = batchIndex * batchSize;
    const batch = MONITORED_TEAM_IDS.slice(startIdx, startIdx + batchSize);

    for (let i = 0; i < batch.length; i++) {
      const teamId = batch[i];

      // Respect rate limit: 10 requests/min → wait 7s between calls
      if (i > 0) await delay(7000);

      try {
        const transferData = await fetchTransfers(teamId);

        for (const entry of transferData) {
          for (const transfer of entry.transfers) {
            const transferDate = new Date(transfer.date);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            if (transferDate < thirtyDaysAgo) continue;

            const { data: existing } = await supabase
              .from("transfers")
              .select("id")
              .eq("player_name", entry.player.name)
              .eq("date", transfer.date)
              .eq("to_team", transfer.teams.in.name)
              .maybeSingle();

            const isNew = !existing;

            const { error } = await supabase.from("transfers").upsert({
              player_name: entry.player.name,
              from_team: transfer.teams.out.name,
              to_team: transfer.teams.in.name,
              transfer_type: transfer.type,
              fee: "Non communiqué",
              date: transfer.date,
            });

            if (error) {
              console.error("Error upserting transfer:", error);
              continue;
            }
            transfersUpserted++;

            if (isNew) {
              try {
                const userPrompt = buildTransferUserPrompt({
                  playerName: entry.player.name,
                  age: 0,
                  nationality: "",
                  position: "",
                  fromClub: transfer.teams.out.name,
                  toClub: transfer.teams.in.name,
                  loanDeal: transfer.type === "Loan",
                  officialDate: transfer.date,
                });

                const articleData = await generateArticle(
                  TRANSFER_SYSTEM_PROMPT,
                  userPrompt
                );

                if (articleData) {
                  let cleanData = articleData;
                  if (typeof cleanData === "string") {
                    cleanData = cleanData.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
                  }
                  const parsed = JSON.parse(cleanData);
                  const slug = generateSlug(parsed.title || "transfert");

                  await supabase.from("articles").insert({
                    title: parsed.title,
                    slug,
                    excerpt: parsed.excerpt,
                    content: parsed.content,
                    type: "transfer",
                    seo_title: parsed.seo_title || parsed.title,
                    seo_description: parsed.seo_description || parsed.excerpt,
                    tags: parsed.tags || [],
                    published_at: new Date().toISOString(),
                  });
                  articlesGenerated++;
                }
              } catch (articleErr) {
                console.error(`Error generating transfer article:`, articleErr);
              }
            }
          }
        }
      } catch (err) {
        console.error(`Error processing transfers for team ${teamId}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      transfers_upserted: transfersUpserted,
      articles_generated: articlesGenerated,
      batch: `${startIdx}-${startIdx + batch.length} of ${MONITORED_TEAM_IDS.length}`,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
    });
  } catch (error) {
    console.error("Error in scrape-transfers cron:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
