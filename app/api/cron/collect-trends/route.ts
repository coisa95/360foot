import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { verifyCronAuth } from "@/lib/auth";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const googleTrends = require("google-trends-api");

export const maxDuration = 300;

// 16 pays francophones d'Afrique + France
const COUNTRIES = [
  { code: "CI", name: "Côte d'Ivoire", geo: "CI" },
  { code: "SN", name: "Sénégal", geo: "SN" },
  { code: "CM", name: "Cameroun", geo: "CM" },
  { code: "ML", name: "Mali", geo: "ML" },
  { code: "BF", name: "Burkina Faso", geo: "BF" },
  { code: "GN", name: "Guinée", geo: "GN" },
  { code: "TG", name: "Togo", geo: "TG" },
  { code: "BJ", name: "Bénin", geo: "BJ" },
  { code: "NE", name: "Niger", geo: "NE" },
  { code: "TD", name: "Tchad", geo: "TD" },
  { code: "CD", name: "RD Congo", geo: "CD" },
  { code: "CG", name: "Congo", geo: "CG" },
  { code: "GA", name: "Gabon", geo: "GA" },
  { code: "MG", name: "Madagascar", geo: "MG" },
  { code: "TN", name: "Tunisie", geo: "TN" },
  { code: "DZ", name: "Algérie", geo: "DZ" },
  { code: "MA", name: "Maroc", geo: "MA" },
  { code: "FR", name: "France", geo: "FR" },
];

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET(request: Request) {
  try {
    if (!verifyCronAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();
    const errors: string[] = [];
    let keywordsCollected = 0;

    for (const country of COUNTRIES) {
      try {
        // 1. Récupérer les tendances "football" pour ce pays
        const relatedResult = await googleTrends.relatedQueries({
          keyword: "football",
          geo: country.geo,
          hl: "fr",
          category: 294, // Catégorie "Football" dans Google Trends
        });

        const parsed = JSON.parse(relatedResult);
        const queries = parsed?.default?.rankedList || [];

        const keywords: {
          keyword: string;
          volume_score: number;
          related_queries: string[];
        }[] = [];

        // Top queries (les plus recherchées)
        const topQueries = queries[0]?.rankedKeyword || [];
        for (const q of topQueries.slice(0, 10)) {
          keywords.push({
            keyword: q.query,
            volume_score: q.value || 0,
            related_queries: [],
          });
        }

        // Rising queries (en forte hausse)
        const risingQueries = queries[1]?.rankedKeyword || [];
        for (const q of risingQueries.slice(0, 10)) {
          keywords.push({
            keyword: q.query,
            volume_score: q.value || 0,
            related_queries: [],
          });
        }

        // 2. Récupérer aussi les tendances du jour (daily trends)
        try {
          const dailyResult = await googleTrends.dailyTrends({
            geo: country.geo,
            hl: "fr",
          });

          const dailyParsed = JSON.parse(dailyResult);
          const trendingSearches =
            dailyParsed?.default?.trendingSearchesDays?.[0]
              ?.trendingSearches || [];

          for (const trend of trendingSearches) {
            const title = (trend.title?.query || "").toLowerCase();
            const relatedQueriesList = (trend.relatedQueries || []).map(
              (rq: { query: string }) => rq.query
            );

            // Filtrer : garder uniquement si lié au football
            const allText = `${title} ${relatedQueriesList.join(" ")}`.toLowerCase();
            const footballTerms = [
              "football", "foot", "soccer", "match", "ligue",
              "champions", "transfert", "mercato", "can", "afcon",
              "fifa", "uefa", "caf", "but", "gardien", "penalty",
              "classement", "résultat", "joueur", "entraîneur",
              "stade", "ballon", "équipe", "sélection",
            ];

            if (footballTerms.some((term) => allText.includes(term))) {
              keywords.push({
                keyword: trend.title.query,
                volume_score: parseInt(trend.formattedTraffic?.replace(/[^0-9]/g, "") || "0", 10),
                related_queries: relatedQueriesList,
              });
            }
          }
        } catch {
          // Daily trends pas dispo pour tous les pays — on continue
        }

        // 3. Sauvegarder en base
        if (keywords.length > 0) {
          const fetchDate = new Date().toISOString().split("T")[0];
          const rows = keywords.map((kw) => ({
            keyword: kw.keyword,
            country_code: country.code,
            country_name: country.name,
            volume_score: kw.volume_score,
            related_queries: kw.related_queries,
            source: "google_trends",
            fetched_at: new Date().toISOString(),
            fetch_date: fetchDate,
          }));

          const { error } = await supabase
            .from("trending_keywords")
            .upsert(rows, { onConflict: "keyword,country_code,fetch_date" })
            .select();

          if (error) {
            errors.push(`${country.name}: DB error — ${error.message}`);
          } else {
            keywordsCollected += rows.length;
          }
        }

        console.log(
          `✅ ${country.name}: ${keywords.length} mots-clés collectés`
        );

        // Rate limiting — Google Trends bloque si trop rapide
        await delay(3000);
      } catch (error) {
        const msg = `${country.name}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`❌ ${msg}`);
        errors.push(msg);
        await delay(2000);
        continue;
      }
    }

    return NextResponse.json({
      success: true,
      keywordsCollected,
      countriesProcessed: COUNTRIES.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      message: `${keywordsCollected} mots-clés tendance collectés depuis ${COUNTRIES.length} pays`,
    });
  } catch (error) {
    console.error("Error in collect-trends cron:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
