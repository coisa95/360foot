import { generateArticle } from "./llm";
import { RSS_ARTICLE_SYSTEM_PROMPT, buildRSSUserPrompt } from "./rss-prompt";
import type { RSSItem } from "./rss-prompt";
import { createClient } from "./supabase";
import { addInternalLinks } from "./internal-links";
import { getArticleImages, injectImagesIntoHTML, buildArticleOgUrl } from "./images";
import { markAsProcessed } from "./rss-fetcher";
import { publishToTelegram } from "./telegram";

// ── Cache module-level pour addInternalLinks (Fix #10: 1 query/run, pas 1/article) ──
let _linksCache: {
  teams: { name: string; slug: string }[];
  players: { name: string; slug: string }[];
  leagues: { name: string; slug: string }[];
  fetchedAt: number;
} | null = null;
const LINKS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

async function getCachedLinksData() {
  if (_linksCache && Date.now() - _linksCache.fetchedAt < LINKS_CACHE_TTL_MS) {
    return _linksCache;
  }
  const supabase = createClient();
  const [{ data: teams }, { data: players }, { data: leagues }] =
    await Promise.all([
      supabase.from("teams").select("name, slug"),
      supabase.from("players").select("name, slug"),
      supabase.from("leagues").select("id, name, slug"),
    ]);
  _linksCache = {
    teams: (teams || []).map((t: Record<string, unknown>) => ({
      name: t.name as string,
      slug: t.slug as string,
    })),
    players: (players || []).map((p: Record<string, unknown>) => ({
      name: p.name as string,
      slug: p.slug as string,
    })),
    leagues: (leagues || []).map((l: Record<string, unknown>) => ({
      name: l.name as string,
      slug: l.slug as string,
    })),
    fetchedAt: Date.now(),
  };
  return _linksCache;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100)
    .replace(/^-|-$/g, "");
}

export async function generateArticleFromRSS(
  item: RSSItem
): Promise<string | null> {
  try {
    // 0. Récupérer les mots-clés tendance du jour
    const supabaseForTrends = createClient();
    const today = new Date().toISOString().split("T")[0];
    const { data: trendingData } = await supabaseForTrends
      .from("trending_keywords")
      .select("keyword")
      .gte("fetched_at", today)
      .order("volume_score", { ascending: false })
      .limit(15);

    const trendingKeywords = trendingData?.map((t: { keyword: string }) => t.keyword) || [];

    // 1. Appel LLM pour générer l'article (DeepSeek via wrapper unifié)
    const text = await generateArticle(
      RSS_ARTICLE_SYSTEM_PROMPT,
      buildRSSUserPrompt(item, trendingKeywords)
    );

    // 2. Parser la réponse JSON (avec guard contre hallucination du LLM)
    const cleaned = text.replace(/```json|```/g, "").trim();

    let article: Record<string, unknown>;
    try {
      article = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error(
        `❌ JSON.parse fail pour ${item.link}: ${parseErr}. Réponse LLM (100 premiers chars): ${cleaned.slice(0, 100)}`
      );
      // Blacklister l'URL pour ne pas retenter (boucle $$$ sinon)
      await markAsProcessed(item.link, null);
      return null;
    }

    // 3. Générer le slug
    const slug = generateSlug(article.title as string);

    // 4. Maillage interne automatique (cache module-level, 1 query/5min)
    const supabase = createClient();
    const linksData = await getCachedLinksData();

    let content = addInternalLinks(
      article.content as string,
      linksData.teams,
      linksData.players,
      linksData.leagues
    );

    // 5. Ajouter les images
    const articleContent = article.content as string;
    const articleTitle = article.title as string;
    const articleExcerpt = article.excerpt as string;
    const articleSeoTitle = article.seo_title as string;
    const articleTags = (article.tags as string[]) || [];
    const articleLigues = (article.ligues as string[]) || [];
    const articleClubs = (article.clubs as string[]) || [];
    const articleCompetitions = (article.competitions as string[]) || [];

    const detectedTeams = extractTeamNames(articleContent);
    const detectedLeague = detectLeague([
      ...articleTags,
      ...articleLigues,
      ...articleCompetitions,
    ]);

    // Use RSS source image if available
    const rssImageUrl = item.imageUrl || undefined;

    const images = await getArticleImages({
      title: articleTitle,
      teams: detectedTeams,
      league: detectedLeague,
      type: "trending",
      tags: articleTags,
      rssImageUrl,
    });
    content = injectImagesIntoHTML(content, images);

    // 6. Ajouter la mention des sources
    content += `\n<div class="sources" style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #1E2A40; font-size: 13px; color: #6B7280;">
      <p><strong>Sources :</strong> <a href="${item.link}" target="_blank" rel="noopener noreferrer nofollow" style="color: #84cc16;">${item.source}</a></p>
    </div>`;

    // 7. Détecter la ligue associée pour le league_id
    const leagueId = findLeagueId(
      linksData.leagues as unknown as Record<string, unknown>[],
      articleLigues,
      articleClubs,
      articleTags
    );

    // 8. Construire les tags enrichis (fusionner tags + entités)
    const enrichedTags = buildEnrichedTags(article);

    // 9. Sauvegarder dans Supabase
    const { data, error } = await supabase
      .from("articles")
      .insert({
        title: articleTitle,
        slug,
        content,
        excerpt: articleExcerpt,
        type: "trending",
        seo_title: articleSeoTitle,
        seo_description: articleExcerpt,
        og_image_url: rssImageUrl || buildArticleOgUrl({
          title: articleTitle,
          type: "trending",
          league: detectedLeague,
        }),
        tags: enrichedTags,
        league_id: leagueId,
        published_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) throw error;

    // 10. Marquer comme traité
    await markAsProcessed(item.link, data.id);

    // 11. Publier sur Telegram (non-bloquant — un échec Telegram ne doit pas
    //     empêcher le return de l'articleId ni la suite du cron)
    publishToTelegram({
      title: article.title as string,
      slug,
      excerpt: article.excerpt as string,
      type: "trending",
      imageUrl: rssImageUrl,
      tags: enrichedTags,
      league: detectedLeague,
    }).catch((err) =>
      console.error(`⚠️ Telegram publish failed (non-fatal): ${err}`)
    );

    console.log(
      `✅ Article RSS généré : ${article.title} | Joueurs: ${((article.joueurs as string[]) || []).length} | Clubs: ${((article.clubs as string[]) || []).length} | Ligue: ${detectedLeague}`
    );
    return data.id;
  } catch (error) {
    console.error(`❌ Erreur génération RSS : ${error}`);
    return null;
  }
}

// ============================================
// HELPERS
// ============================================

function extractTeamNames(html: string): string[] {
  const knownTeams = [
    // Europe
    "PSG", "Paris Saint-Germain", "Marseille", "Lyon", "Monaco", "Lille",
    "Lens", "Rennes", "Nice", "Strasbourg", "Toulouse", "Nantes",
    "Liverpool", "Manchester United", "Manchester City", "Chelsea", "Arsenal",
    "Tottenham", "Newcastle", "Aston Villa", "Brighton", "West Ham",
    "Real Madrid", "Barcelona", "Atletico Madrid", "Sevilla", "Real Sociedad",
    "Bayern Munich", "Borussia Dortmund", "RB Leipzig", "Bayer Leverkusen",
    "Juventus", "Inter Milan", "AC Milan", "Napoli", "Roma", "Atalanta",
    // Afrique
    "ASEC", "ASEC Mimosas", "Africa Sports", "San-Pédro",
    "Diambars", "Jaraaf", "Casa Sports",
    "Coton Sport", "Canon Yaoundé", "Stade Malien", "Djoliba",
    "TP Mazembe", "AS Vita Club", "Mamelodi Sundowns",
    "Al-Ahly", "Zamalek", "Wydad", "Raja", "Esperance",
    // Autres
    "Al-Nassr", "Al-Hilal", "Inter Miami",
    "Galatasaray", "Fenerbahce",
  ];

  return knownTeams.filter((team) =>
    html.toLowerCase().includes(team.toLowerCase())
  );
}

function detectLeague(tags: string[]): string {
  const tagStr = tags.join(" ").toLowerCase();

  // 1. Compétitions internationales (avant les ligues domestiques)
  if (tagStr.includes("champions league") || tagStr.includes("ligue des champions")) return "Champions League";
  if (tagStr.includes("europa league") || tagStr.includes("ligue europa")) return "Europa League";
  if (tagStr.includes("conference league")) return "Conference League";
  if (tagStr.includes("can") || tagStr.includes("afcon") || tagStr.includes("coupe d'afrique")) return "CAN";

  // 2. Ligues africaines (avant Ligue 1 France pour éviter les faux positifs)
  if (tagStr.includes("ligue 1 côte") || tagStr.includes("ligue 1 cote") || tagStr.includes("ligue 1 ivoirienne") || tagStr.includes("côte d'ivoire") || tagStr.includes("cote d'ivoire")) return "Ligue 1 Côte d'Ivoire";
  if (tagStr.includes("ligue pro sénégal") || tagStr.includes("ligue sénégalaise") || tagStr.includes("ligue pro senegal")) return "Ligue Pro Sénégal";
  if (tagStr.includes("elite one") || tagStr.includes("elite one cameroun")) return "Elite One Cameroun";

  // 3. Ligues européennes (ordre spécifique pour éviter les conflits)
  if (tagStr.includes("bundesliga")) return "Bundesliga";
  if (tagStr.includes("serie a") || tagStr.includes("calcio")) return "Serie A";
  if (tagStr.includes("premier league") || tagStr.includes("premier-league") || tagStr.includes("epl")) return "Premier League";
  if (tagStr.includes("la liga") || tagStr.includes("liga española") || tagStr.includes("liga espagnole")) return "La Liga";
  if (tagStr.includes("ligue-1") || tagStr.includes("ligue 1") || tagStr.includes("ligue1")) return "Ligue 1";

  // 4. Autres
  if (tagStr.includes("mls")) return "MLS";
  if (tagStr.includes("saudi") || tagStr.includes("saoudien")) return "Saudi Pro League";
  if (tagStr.includes("mercato") || tagStr.includes("transfert")) return "Mercato";
  if (tagStr.includes("afrique") || tagStr.includes("africa")) return "Football Africain";
  return "Football";
}

// Trouver le league_id Supabase correspondant
function findLeagueId(
  leagues: Record<string, unknown>[],
  articleLigues: string[],
  articleClubs: string[],
  articleTags: string[]
): string | null {
  if (!leagues || leagues.length === 0) return null;

  const allText = [...articleLigues, ...articleClubs, ...articleTags]
    .join(" ")
    .toLowerCase();

  // Mapping des mots-clés vers les slugs de ligues en DB
  const leagueKeywords: Record<string, string[]> = {
    "ligue-1-france": ["ligue 1", "ligue1", "ligue 1 france"],
    "premier-league": ["premier league", "epl", "english premier"],
    "la-liga": ["la liga", "liga espagnole", "liga española"],
    "serie-a": ["serie a", "calcio", "serie a italienne"],
    "bundesliga": ["bundesliga"],
    "champions-league": ["champions league", "ligue des champions", "ucl"],
    "europa-league": ["europa league", "ligue europa"],
    "ligue-1-cote-divoire": ["ligue 1 côte d'ivoire", "ligue 1 cote d'ivoire", "ligue 1 ivoirienne"],
    "ligue-pro-senegal": ["ligue pro sénégal", "ligue sénégalaise"],
    "elite-one-cameroun": ["elite one", "cameroun football"],
    "celtiis-ligue-1-benin": ["celtiis ligue 1", "ligue 1 bénin", "ligue 1 benin", "championnat béninois", "championnat beninois"],
    "botola-pro": ["botola", "championnat marocain", "ligue 1 marocaine"],
    "ligue-1-tunisie": ["ligue 1 tunisie", "championnat tunisien", "ligue 1 pro tunisie"],
    "linafoot-rdc": ["linafoot", "ligue 1 rdc", "championnat congolais", "vodacom ligue 1"],
    "primus-ligue-mali": ["primus ligue", "ligue 1 malienne", "championnat malien"],
    "fasofoot-burkina-faso": ["fasofoot", "faso foot", "championnat burkinabé", "championnat burkinabe"],
    "can": ["can", "afcon", "coupe d'afrique"],
    "mls": ["mls", "major league soccer"],
    "saudi-pro-league": ["saudi pro league", "saudi", "saoudien"],
  };

  for (const [leagueSlug, keywords] of Object.entries(leagueKeywords)) {
    if (keywords.some((kw) => allText.includes(kw))) {
      const league = leagues.find(
        (l) => (l.slug as string) === leagueSlug
      );
      if (league) return league.id as string;
    }
  }

  return null;
}

// Construire des tags enrichis à partir des entités extraites
function buildEnrichedTags(article: Record<string, unknown>): string[] {
  const tags = new Set<string>((article.tags as string[]) || []);

  // Ajouter les ligues comme tags
  for (const ligue of (article.ligues as string[]) || []) {
    tags.add(ligue);
  }

  // Ajouter les compétitions comme tags
  for (const comp of (article.competitions as string[]) || []) {
    tags.add(comp);
  }

  // Ajouter les clubs principaux (max 3)
  const clubs = (article.clubs as string[]) || [];
  for (const club of clubs.slice(0, 3)) {
    tags.add(club);
  }

  return Array.from(tags).slice(0, 10); // Max 10 tags
}
