import Parser from "rss-parser";
import { createClient } from "./supabase";
import type { RSSItem } from "./rss-prompt";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "360FootBot/1.0 (+https://360-foot.com)",
  },
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: false }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: false }],
      ["enclosure", "enclosure", { keepArray: false }],
    ],
  },
});

export async function fetchRSSFeed(
  feedUrl: string,
  source: string
): Promise<RSSItem[]> {
  // Retry 1× sur échec transient (503, timeout, réseau)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const feed = await parser.parseURL(feedUrl);

      return (feed.items || []).map((item) => {
        // Extract image from various RSS fields
        const feedItem = item as unknown as Record<string, unknown>;
        const imageUrl =
          extractImageUrl(feedItem.mediaContent) ||
          extractImageUrl(feedItem.mediaThumbnail) ||
          extractEnclosureImage(feedItem.enclosure) ||
          extractImageFromContent(item.content || "") ||
          undefined;

        return {
          title: item.title || "",
          summary: (item.contentSnippet || "").slice(0, 500),
          link: normalizeUrl(item.link || ""),
          date: item.isoDate || item.pubDate || new Date().toISOString(),
          source,
          details: item.categories?.join(", ") || undefined,
          imageUrl,
        };
      });
    } catch (error) {
      if (attempt === 0) {
        console.warn(`⚠️ RSS ${source} attempt 1 failed, retrying in 3s...`);
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }
      console.error(`❌ RSS ${source}: ${error}`);
      return [];
    }
  }
  return [];
}

// ============================================
// IMAGE EXTRACTION from RSS fields
// ============================================

function extractImageUrl(field: unknown): string | null {
  if (!field) return null;
  // media:content or media:thumbnail can be { $: { url: "..." } } or { url: "..." }
  if (typeof field === "object") {
    const obj = field as Record<string, unknown>;
    if (typeof obj.url === "string" && isValidImageUrl(obj.url)) return obj.url;
    const attrs = obj.$ as Record<string, string> | undefined;
    if (attrs?.url && isValidImageUrl(attrs.url)) return attrs.url;
  }
  if (typeof field === "string" && isValidImageUrl(field)) return field;
  return null;
}

function extractEnclosureImage(enclosure: unknown): string | null {
  if (!enclosure) return null;
  const obj = enclosure as Record<string, unknown>;
  const url = (obj.url as string) || ((obj.$ as Record<string, string>)?.url);
  const type = (obj.type as string) || ((obj.$ as Record<string, string>)?.type) || "";
  if (url && (type.startsWith("image/") || isValidImageUrl(url))) return url;
  return null;
}

function extractImageFromContent(html: string): string | null {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match?.[1] && isValidImageUrl(match[1])) return match[1];
  return null;
}

function isValidImageUrl(url: string): boolean {
  return (
    url.startsWith("http") &&
    (url.includes(".jpg") || url.includes(".jpeg") || url.includes(".png") ||
     url.includes(".webp") || url.includes("/images/") || url.includes("/photo/") ||
     url.includes("/img/") || url.includes("wp-content/uploads"))
  );
}

// ============================================
// DÉDUPLICATION — Ne pas traiter 2 fois la même actu
// ============================================

/** Normalise une URL pour éviter les doublons d'encoding (%C3%A9 vs é, trailing slashes) */
export function normalizeUrl(url: string): string {
  try {
    const decoded = decodeURIComponent(url);
    return decoded.replace(/\/+$/, "").replace(/\s+/g, "");
  } catch {
    // decodeURIComponent peut throw sur des % invalides
    return url.replace(/\/+$/, "").replace(/\s+/g, "");
  }
}

export async function isAlreadyProcessed(link: string): Promise<boolean> {
  const supabase = createClient();
  const norm = normalizeUrl(link);
  const { data } = await supabase
    .from("rss_processed")
    .select("id")
    .eq("source_url", norm)
    .limit(1);

  return (data?.length || 0) > 0;
}

export async function markAsProcessed(
  link: string,
  articleId: string | null
): Promise<void> {
  const supabase = createClient();
  await supabase.from("rss_processed").insert({
    source_url: normalizeUrl(link),
    article_id: articleId,
    processed_at: new Date().toISOString(),
  });
}

export type { RSSItem };
