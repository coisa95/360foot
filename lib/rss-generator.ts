import Anthropic from "@anthropic-ai/sdk";
import { RSS_ARTICLE_SYSTEM_PROMPT, buildRSSUserPrompt } from "./rss-prompt";
import type { RSSItem } from "./rss-prompt";
import { createClient } from "./supabase";
import { addInternalLinks } from "./internal-links";
import { getArticleImages, injectImagesIntoHTML, buildArticleOgUrl } from "./images";
import { markAsProcessed } from "./rss-fetcher";
import { publishToTelegram } from "./telegram";

const anthropic = new Anthropic();

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
    // 1. Appel Claude pour générer l'article
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: RSS_ARTICLE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildRSSUserPrompt(item) }],
    });

    // 2. Parser la réponse JSON
    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const article = JSON.parse(cleaned);

    // 3. Générer le slug
    const slug = generateSlug(article.title);

    // 4. Maillage interne automatique
    const supabase = createClient();
    const [{ data: teams }, { data: players }, { data: leagues }] =
      await Promise.all([
        supabase.from("teams").select("name, slug"),
        supabase.from("players").select("name, slug"),
        supabase.from("leagues").select("id, name, slug"),
      ]);

    let content = addInternalLinks(
      article.content,
      (teams || []).map((t: Record<string, unknown>) => ({
        name: t.name as string,
        slug: t.slug as string,
      })),
      (players || []).map((p: Record<string, unknown>) => ({
        name: p.name as string,
        slug: p.slug as string,
      })),
      (leagues || []).map((l: Record<string, unknown>) => ({
        name: l.name as string,
        slug: l.slug as string,
      }))
    );

    // 5. Ajouter les images
    const detectedTeams = extractTeamNames(article.content);
    const detectedLeague = detectLeague([
      ...(article.tags || []),
      ...(article.ligues || []),
      ...(article.competitions || []),
    ]);

    // Use RSS source image if available
    const rssImageUrl = item.imageUrl || undefined;

    const images = await getArticleImages({
      title: article.title,
      teams: detectedTeams,
      league: detectedLeague,
      type: "trending",
      tags: article.tags || [],
      rssImageUrl,
    });
    content = injectImagesIntoHTML(content, images);

    // 6. Ajouter la mention des sources
    content += `\n<div class="sources" style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #1E2A40; font-size: 13px; color: #6B7280;">
      <p><strong>Sources :</strong> <a href="${item.link}" target="_blank" rel="noopener noreferrer nofollow" style="color: #84cc16;">${item.source}</a></p>
    </div>`;

    // 7. Détecter la ligue associée pour le league_id
    const leagueId = findLeagueId(
      leagues || [],
      article.ligues || [],
      article.clubs || [],
      article.tags || []
    );

    // 8. Construire les tags enrichis (fusionner tags + entités)
    const enrichedTags = buildEnrichedTags(article);

    // 9. Sauvegarder dans Supabase
    const { data, error } = await supabase
      .from("articles")
      .insert({
        title: article.title,
        slug,
        content,
        excerpt: article.excerpt,
        type: "trending",
        seo_title: article.seo_title,
        seo_description: article.excerpt,
        og_image_url: rssImageUrl || buildArticleOgUrl({
          title: article.title,
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

    // 11. Publier sur Telegram
    await publishToTelegram({
      title: article.title,
      slug,
      excerpt: article.excerpt,
      type: "trending",
      imageUrl: rssImageUrl,
      tags: enrichedTags,
      league: detectedLeague,
    });

    console.log(
      `✅ Article RSS généré : ${article.title} | Joueurs: ${(article.joueurs || []).length} | Clubs: ${(article.clubs || []).length} | Ligue: ${detectedLeague}`
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
  if (tagStr.includes("ligue 1 côte") || tagStr.includes("ligue 1 cote")) return "Ligue 1 Côte d'Ivoire";
  if (tagStr.includes("ligue-1") || tagStr.includes("ligue 1") || tagStr.includes("ligue1")) return "Ligue 1";
  if (tagStr.includes("premier league") || tagStr.includes("premier-league")) return "Premier League";
  if (tagStr.includes("la liga") || tagStr.includes("liga")) return "La Liga";
  if (tagStr.includes("champions league") || tagStr.includes("ligue des champions")) return "Champions League";
  if (tagStr.includes("europa league")) return "Europa League";
  if (tagStr.includes("conference league")) return "Conference League";
  if (tagStr.includes("can") || tagStr.includes("afcon") || tagStr.includes("coupe d'afrique")) return "CAN";
  if (tagStr.includes("serie a")) return "Serie A";
  if (tagStr.includes("bundesliga")) return "Bundesliga";
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
