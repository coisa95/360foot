/**
 * Cron : scrape les médias africains locaux qui couvrent UN championnat précis.
 *
 * Différence avec `process-rss` :
 *   - Sources liées à un `leagueSlug` (tagging automatique de l'article).
 *   - Filtre strict senior-hommes-championnat : on exclut féminin, U15/17/20/23,
 *     scolaire, autres disciplines, sélections U, etc.
 *   - Fréquence basse recommandée (1×/heure) car les médias locaux sont peu
 *     volatils par rapport aux gros agrégateurs.
 *
 * Dépendances réutilisées :
 *   - fetchRSSFeed / isAlreadyProcessed  (lib/rss-fetcher)
 *   - generateArticleFromRSS             (lib/rss-generator)
 */
import { NextResponse } from "next/server";
import { fetchRSSFeed, isAlreadyProcessed } from "@/lib/rss-fetcher";
import { generateArticleFromRSS } from "@/lib/rss-generator";
import { verifyCronAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase";
import {
  AFRICAN_SOURCES,
  COUNTRY_NATIONAL_MARKER,
  isSeniorMenChampionshipArticle,
  MIN_CLUB_NAME_LENGTH,
} from "@/lib/scrapers/african-sources";
import { fetchHTMLArticles } from "@/lib/scrapers/html-fetcher";
import type { RSSItem } from "@/lib/rss-prompt";
import type { AfricanSource } from "@/lib/scrapers/african-sources";

export const maxDuration = 300;

// Nombre max d'articles générés par exécution (limite tokens LLM + 300s Vercel)
const MAX_ARTICLES_PER_RUN = 8;
// Nombre max d'articles par source pour diversifier les pays
const MAX_PER_SOURCE = 2;
// Rate limiting LLM API entre 2 générations (ms)
const LLM_THROTTLE_MS = 2000;

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const supabase = createClient();

  // Charger le mapping leagueSlug → league_id une seule fois
  const { data: leaguesRows } = await supabase
    .from("leagues")
    .select("id, slug");
  const leagueIdBySlug = new Map<string, string>(
    (leaguesRows || []).map((l: Record<string, unknown>) => [
      l.slug as string,
      l.id as string,
    ])
  );

  // Charger les clubs seniors de chaque championnat couvert — cache leagueSlug → [noms]
  const clubsByLeagueSlug = new Map<string, string[]>();
  for (const src of AFRICAN_SOURCES) {
    if (clubsByLeagueSlug.has(src.leagueSlug)) continue;
    const leagueId = leagueIdBySlug.get(src.leagueSlug);
    if (!leagueId) {
      clubsByLeagueSlug.set(src.leagueSlug, []);
      continue;
    }
    const { data: teams } = await supabase
      .from("teams")
      .select("name")
      .eq("league_id", leagueId);
    const names = (teams || [])
      .map((t: Record<string, unknown>) => (t.name as string) || "")
      .filter((n) => n.length >= MIN_CLUB_NAME_LENGTH);
    clubsByLeagueSlug.set(src.leagueSlug, names);
  }

  // Filtrer les sources désactivées (mortes / 403 prod / parseur KO) puis trier
  const sorted = AFRICAN_SOURCES
    .filter((s) => !s.disabled)
    .sort((a, b) => a.reliability - b.reliability);

  let articlesGenerated = 0;
  const errors: string[] = [];
  const stats: Array<{
    source: string;
    country: string;
    league: string;
    fetched: number;
    kept: number;
    skippedFilter: number;
    skippedDedup: number;
    generated: number;
  }> = [];

  for (const src of sorted) {
    if (articlesGenerated >= MAX_ARTICLES_PER_RUN) break;

    const stat = {
      source: src.source,
      country: src.country,
      league: src.championshipName,
      fetched: 0,
      kept: 0,
      skippedFilter: 0,
      skippedDedup: 0,
      generated: 0,
    };

    try {
      const items = await fetchItemsForSource(src);
      stat.fetched = items.length;
      if (items.length === 0) {
        stats.push(stat);
        continue;
      }

      // Regarder 30 items pour ne pas rater d'articles seniors après des blocs de contenu filtré
      const recentItems = items.slice(0, 30);

      for (const item of recentItems) {
        if (articlesGenerated >= MAX_ARTICLES_PER_RUN) break;
        if (stat.generated >= MAX_PER_SOURCE) break;

        // Filtre 1 : championnat senior masculin uniquement
        //   — clubs dynamiques chargés depuis la BDD pour ce championnat
        //   — adjectif national (burkinab, ivoirien, béninois…) pour rattraper
        //     les articles joueurs/transferts sans mot-clé ligue explicite
        const filter = isSeniorMenChampionshipArticle({
          title: item.title || "",
          summary: item.summary || "",
          knownClubs: clubsByLeagueSlug.get(src.leagueSlug) || [],
          nationalityMarker: COUNTRY_NATIONAL_MARKER[src.country],
        });
        if (!filter.keep) {
          stat.skippedFilter++;
          continue;
        }
        stat.kept++;

        // Filtre 2 : déduplication (URL déjà traitée)
        const alreadyDone = await isAlreadyProcessed(item.link);
        if (alreadyDone) {
          stat.skippedDedup++;
          continue;
        }

        // Génération LLM + insertion
        // Note : on enrichit le champ source/details pour que le prompt
        // comprenne le contexte championnat et que `findLeagueId` matche.
        const enrichedItem = {
          ...item,
          source: src.source,
          details: [
            item.details,
            src.championshipName,
            src.country,
          ]
            .filter(Boolean)
            .join(" • "),
        };

        const articleId = await generateArticleFromRSS(enrichedItem);

        if (articleId) {
          // Force le tagging ligue si le détecteur automatique n'a pas trouvé
          const leagueId = leagueIdBySlug.get(src.leagueSlug);
          if (leagueId) {
            await supabase
              .from("articles")
              .update({ league_id: leagueId })
              .eq("id", articleId)
              .is("league_id", null);
          }

          articlesGenerated++;
          stat.generated++;

          // Throttle LLM API
          await new Promise((r) => setTimeout(r, LLM_THROTTLE_MS));
        }
      }
    } catch (err) {
      const msg = `Erreur source ${src.source}: ${err}`;
      console.error(msg);
      errors.push(msg);
    }

    stats.push(stat);
  }

  // Enregistrer le run pour observabilité (table cron_runs)
  const endTime = Date.now();
  try {
    await supabase.from("cron_runs").insert({
      cron_name: "scrape-african-local",
      started_at: new Date(startTime).toISOString(),
      duration_ms: endTime - startTime,
      articles_generated: articlesGenerated,
      sources_processed: stats.length,
      errors: errors.length > 0 ? errors : null,
      stats,
    });
  } catch (cronRunErr) {
    console.error("cron_runs insert failed:", cronRunErr);
  }

  return NextResponse.json({
    success: true,
    articles_generated: articlesGenerated,
    sources_processed: stats.length,
    stats,
    errors: errors.length > 0 ? errors : undefined,
  });
}

/**
 * Router fetch : RSS (défaut) ou HTML scraping selon `fetchMode`.
 * Harmonise la sortie en `RSSItem[]` pour que le reste du pipeline
 * (filtre + dédup + LLM) reste inchangé.
 */
async function fetchItemsForSource(src: AfricanSource): Promise<RSSItem[]> {
  if (src.fetchMode === "html") {
    if (!src.htmlConfig) {
      console.warn(`[${src.source}] fetchMode=html mais htmlConfig manquant`);
      return [];
    }
    return fetchHTMLArticles(src.htmlConfig, src.source);
  }
  return fetchRSSFeed(src.rssUrl, src.source);
}
