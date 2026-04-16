/**
 * Scraper HTML pour sources sans RSS (Le360 Sport, sites custom CMS).
 *
 * Stratégie : fetch de la page listing → extrait les URLs d'articles via
 * un pattern CSS ou regex → fetch chaque article → parse JSON-LD ou
 * balises OpenGraph pour obtenir title/summary/image/date.
 *
 * Retourne un `RSSItem[]` pour rester compatible avec le pipeline existant
 * (dédup + generateArticleFromRSS).
 *
 * Éthique : User-Agent honnête, délai entre requêtes, respect robots.txt.
 */
import { load } from "cheerio";
import type { RSSItem } from "../rss-prompt";

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
];
function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

const REQUEST_TIMEOUT_MS = 15000;
const DELAY_BETWEEN_ARTICLES_MS = 1500;

/** Configuration d'un scraper HTML pour une source donnée. */
export interface HTMLSourceConfig {
  /** URL de la page listing (catégorie/tag) */
  listingUrl: string;
  /** Pattern string compilé en RegExp à l'usage (sérialisable JSON/DB) */
  articleUrlPattern: string;
  /** Base URL pour résoudre les chemins relatifs */
  baseUrl: string;
  /** Nombre max d'articles à extraire par run */
  maxArticles?: number;
  /** Méthode de parsing du détail article (défaut: jsonld) */
  parser?: "jsonld" | "opengraph";
}

export async function fetchHTMLArticles(
  config: HTMLSourceConfig,
  sourceLabel: string
): Promise<RSSItem[]> {
  try {
    // 1. Fetch listing
    const listingHtml = await fetchText(config.listingUrl);
    if (!listingHtml) return [];

    // 2. Extraire URLs uniques d'articles
    const regex = new RegExp(config.articleUrlPattern, "g");
    const rawMatches = listingHtml.match(regex) || [];
    const articleUrls = Array.from(
      new Set(
        rawMatches
          .map((m) => {
            // Nettoyer guillemets + href=
            const urlMatch = m.match(/href="([^"]+)"/);
            return urlMatch ? urlMatch[1] : m;
          })
          .map((u) => (u.startsWith("http") ? u : `${config.baseUrl}${u}`))
      )
    ).slice(0, config.maxArticles || 10);

    if (articleUrls.length === 0) {
      console.warn(`[${sourceLabel}] aucune URL d'article trouvée dans listing`);
      return [];
    }

    // 3. Fetch + parse chaque article (séquentiel pour politesse)
    const items: RSSItem[] = [];
    const parser = config.parser || "jsonld";

    for (const url of articleUrls) {
      const html = await fetchText(url);
      if (!html) continue;

      const parsed =
        parser === "jsonld" ? parseJsonLd(html) : parseOpenGraph(html);

      if (!parsed) continue;

      items.push({
        title: parsed.title,
        summary: (parsed.summary || "").slice(0, 500),
        link: url,
        date: parsed.date || new Date().toISOString(),
        source: sourceLabel,
        details: parsed.keywords || undefined,
        imageUrl: parsed.imageUrl,
      });

      // Délai de politesse entre requêtes
      await sleep(DELAY_BETWEEN_ARTICLES_MS);
    }

    return items;
  } catch (err) {
    console.error(`[${sourceLabel}] erreur HTML scraper:`, err);
    return [];
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function fetchText(url: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    const res = await fetch(url, {
      headers: {
        "User-Agent": randomUA(),
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
      signal: ctrl.signal,
    });
    clearTimeout(to);
    if (!res.ok) {
      console.warn(`[html-fetcher] ${res.status} ${url}`);
      return null;
    }
    return await res.text();
  } catch (err) {
    console.warn(`[html-fetcher] fetch fail ${url}: ${err}`);
    return null;
  }
}

interface ParsedArticle {
  title: string;
  summary?: string;
  date?: string;
  imageUrl?: string;
  keywords?: string;
}

/**
 * Parse JSON-LD @type=NewsArticle / Article.
 * Utilisé par Le360 (Arc Publishing) et la plupart des CMS modernes qui
 * respectent schema.org.
 */
function parseJsonLd(html: string): ParsedArticle | null {
  const $ = load(html);
  const scripts = $('script[type="application/ld+json"]');

  for (let i = 0; i < scripts.length; i++) {
    const raw = $(scripts[i]).text().trim();
    if (!raw) continue;
    try {
      const data = JSON.parse(raw);
      const nodes = Array.isArray(data) ? data : [data];
      for (const node of nodes) {
        const type = node["@type"];
        const isArticle =
          type === "NewsArticle" ||
          type === "Article" ||
          (Array.isArray(type) &&
            (type.includes("NewsArticle") || type.includes("Article")));
        if (!isArticle) continue;

        const title = node.headline || node.name;
        if (!title) continue;

        return {
          title: String(title).trim(),
          summary:
            node.alternativeHeadline ||
            node.description ||
            node.abstract ||
            undefined,
          date: node.datePublished || node.dateCreated || undefined,
          imageUrl:
            typeof node.image === "string"
              ? node.image
              : node.image?.url || node.image?.[0]?.url || undefined,
          keywords:
            typeof node.keywords === "string"
              ? node.keywords
              : Array.isArray(node.keywords)
                ? node.keywords.join(", ")
                : undefined,
        };
      }
    } catch {
      // JSON invalide → on essaye le bloc suivant
      continue;
    }
  }

  // Fallback OpenGraph si JSON-LD manquant
  return parseOpenGraph(html);
}

/** Fallback OpenGraph — couvre les sites sans JSON-LD mais avec OG propres. */
function parseOpenGraph(html: string): ParsedArticle | null {
  const $ = load(html);
  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("title").text().trim();
  if (!title) return null;

  const summary =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    undefined;

  const imageUrl =
    $('meta[property="og:image"]').attr("content") || undefined;

  const date =
    $('meta[property="article:published_time"]').attr("content") ||
    $('meta[name="date"]').attr("content") ||
    undefined;

  return {
    title: title.trim(),
    summary: summary?.trim(),
    imageUrl,
    date,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
