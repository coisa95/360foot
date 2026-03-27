import Parser from "rss-parser";
import { createClient } from "./supabase";
import type { RSSItem } from "./rss-prompt";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "360FootBot/1.0 (+https://360foot.info)",
  },
});

export async function fetchRSSFeed(
  feedUrl: string,
  source: string
): Promise<RSSItem[]> {
  try {
    const feed = await parser.parseURL(feedUrl);

    return (feed.items || []).map((item) => ({
      title: item.title || "",
      summary: (item.contentSnippet || "").slice(0, 500),
      link: item.link || "",
      date: item.isoDate || item.pubDate || new Date().toISOString(),
      source,
      details: item.categories?.join(", ") || undefined,
    }));
  } catch (error) {
    console.error(`Erreur RSS ${source}: ${error}`);
    return [];
  }
}

// ============================================
// DÉDUPLICATION — Ne pas traiter 2 fois la même actu
// ============================================

export async function isAlreadyProcessed(link: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from("rss_processed")
    .select("id")
    .eq("source_url", link)
    .limit(1);

  return (data?.length || 0) > 0;
}

export async function markAsProcessed(
  link: string,
  articleId: string
): Promise<void> {
  const supabase = createClient();
  await supabase.from("rss_processed").insert({
    source_url: link,
    article_id: articleId,
    processed_at: new Date().toISOString(),
  });
}

export type { RSSItem };
