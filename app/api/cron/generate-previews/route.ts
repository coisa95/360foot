import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { generateArticle } from "@/lib/claude";
import {
  systemPrompt as PREVIEW_SYSTEM_PROMPT,
  buildUserPrompt as buildPreviewUserPrompt,
} from "@/lib/prompts/preview-article";

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

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();
    const today = new Date().toISOString().split("T")[0];
    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);
    const endDate = in3Days.toISOString().split("T")[0];

    // Find upcoming matches (next 3 days) with status NS or TBD
    const { data: scheduledMatches } = await supabase
      .from("matches")
      .select("*, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name), league:leagues(name)")
      .in("status", ["NS", "TBD"])
      .gte("date", `${today}T00:00:00`)
      .lte("date", `${endDate}T23:59:59`);

    // Get existing preview articles
    const { data: existingPreviews } = await supabase
      .from("articles")
      .select("match_id")
      .eq("type", "preview");

    const existingMatchIds = new Set(
      (existingPreviews || []).map((a: Record<string, unknown>) => a.match_id)
    );

    const matchesWithoutPreviews = (scheduledMatches || []).filter(
      (m: Record<string, unknown>) => !existingMatchIds.has(m.id)
    ).slice(0, 2); // Limit to 2 per execution to avoid Vercel timeout

    let previewsGenerated = 0;

    for (const match of matchesWithoutPreviews) {
      try {
        const homeTeam = match.home_team as Record<string, unknown> | null;
        const awayTeam = match.away_team as Record<string, unknown> | null;
        const league = match.league as Record<string, unknown> | null;

        const userPrompt = buildPreviewUserPrompt({
          homeTeam: (homeTeam?.name as string) || "Équipe A",
          awayTeam: (awayTeam?.name as string) || "Équipe B",
          competition: (league?.name as string) || "",
          date: (match.date as string) || today,
          homeForm: [],
          awayForm: [],
          headToHead: [],
          standings: [],
        });

        const articleData = await generateArticle(
          PREVIEW_SYSTEM_PROMPT,
          userPrompt
        );

        if (!articleData) {
          console.error(`Failed to generate preview for match ${match.id}`);
          continue;
        }

        let cleanData = articleData;
        if (typeof cleanData === "string") {
          cleanData = cleanData.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
        }
        const parsed = JSON.parse(cleanData);
        const slug = generateSlug(parsed.title || "preview");

        const { error: insertError } = await supabase.from("articles").insert({
          title: parsed.title,
          slug,
          excerpt: parsed.excerpt,
          content: parsed.content,
          type: "preview",
          match_id: match.id,
          league_id: match.league_id,
          seo_title: parsed.seo_title || parsed.title,
          seo_description: parsed.seo_description || parsed.excerpt,
          tags: parsed.tags || [],
          published_at: new Date().toISOString(),
        });

        if (insertError) {
          console.error("Error inserting preview:", insertError);
        } else {
          previewsGenerated++;
        }
      } catch (err) {
        console.error(`Error generating preview for match ${match.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      previews_generated: previewsGenerated,
      matches_processed: matchesWithoutPreviews.length,
    });
  } catch (error) {
    console.error("Error in generate-previews cron:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
