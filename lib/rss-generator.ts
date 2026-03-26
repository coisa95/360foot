import Anthropic from "@anthropic-ai/sdk";
import { RSS_ARTICLE_SYSTEM_PROMPT, buildRSSUserPrompt } from "./rss-prompt";
import type { RSSItem } from "./rss-prompt";
import { createClient } from "./supabase";
import { addInternalLinks } from "./internal-links";
import { getArticleImages, injectImagesIntoHTML } from "./images";
import { markAsProcessed } from "./rss-fetcher";

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
      model: "claude-haiku-4-5-20251001",
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
        supabase.from("leagues").select("name, slug"),
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

    // 5. Ajouter les images (module images.ts existant)
    const detectedTeams = extractTeamNames(article.content);
    const images = await getArticleImages({
      title: article.title,
      teams: detectedTeams,
      league: detectLeague(article.tags || []),
      type: "trending",
      tags: article.tags || [],
    });
    content = injectImagesIntoHTML(content, images);

    // 6. Ajouter la mention des sources en bas de l'article
    content += `\n<div class="sources" style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #1E2A40; font-size: 13px; color: #6B7280;">
      <p><strong>Sources :</strong> <a href="${item.link}" target="_blank" rel="noopener noreferrer nofollow" style="color: #84cc16;">${item.source}</a></p>
    </div>`;

    // 7. Sauvegarder dans Supabase
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
        og_image_url: images[0]?.url || null,
        tags: article.tags,
        published_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) throw error;

    // 8. Marquer comme traité (anti-doublon)
    await markAsProcessed(item.link, data.id);

    console.log(`✅ Article RSS généré : ${article.title}`);
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
    "PSG",
    "Marseille",
    "Lyon",
    "Monaco",
    "Lille",
    "ASEC",
    "Africa Sports",
    "Liverpool",
    "Manchester United",
    "Manchester City",
    "Chelsea",
    "Arsenal",
    "Tottenham",
    "Real Madrid",
    "Barcelona",
    "Atletico Madrid",
    "Bayern Munich",
    "Borussia Dortmund",
    "Juventus",
    "Inter Milan",
    "AC Milan",
    "Napoli",
    "Al-Nassr",
    "Al-Hilal",
    "Al-Ahly",
    "Zamalek",
    "TP Mazembe",
    "Wydad",
    "Raja",
    "Esperance",
    "Mamelodi Sundowns",
    "Galatasaray",
    "Fenerbahce",
  ];

  return knownTeams.filter((team) =>
    html.toLowerCase().includes(team.toLowerCase())
  );
}

function detectLeague(tags: string[]): string {
  const tagStr = tags.join(" ").toLowerCase();
  if (tagStr.includes("ligue-1") || tagStr.includes("ligue1")) return "Ligue 1";
  if (tagStr.includes("premier-league") || tagStr.includes("premier league"))
    return "Premier League";
  if (tagStr.includes("liga")) return "La Liga";
  if (tagStr.includes("champions")) return "Champions League";
  if (tagStr.includes("can") || tagStr.includes("afcon")) return "CAN";
  if (tagStr.includes("mercato") || tagStr.includes("transfert"))
    return "Mercato";
  if (tagStr.includes("serie a")) return "Serie A";
  if (tagStr.includes("bundesliga")) return "Bundesliga";
  if (tagStr.includes("mls")) return "MLS";
  if (tagStr.includes("afrique") || tagStr.includes("africa"))
    return "Football Africain";
  return "Football";
}
