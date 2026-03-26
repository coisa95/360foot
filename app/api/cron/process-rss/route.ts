import { NextResponse } from "next/server";
import { fetchRSSFeed, isAlreadyProcessed } from "@/lib/rss-fetcher";
import { generateArticleFromRSS } from "@/lib/rss-generator";
import type { RSSItem } from "@/lib/rss-prompt";

const RSS_FEEDS = [
  // Football africain — priorité haute
  {
    url: "https://www.africatopsports.com/feed/",
    source: "AfricaTopSports",
    priority: 1,
  },
  {
    url: "https://africafoot.com/feed/",
    source: "AfricaFoot",
    priority: 1,
  },

  // Transferts
  {
    url: "https://www.footmercato.net/feed",
    source: "Foot Mercato",
    priority: 1,
  },
  {
    url: "https://www.transfermarkt.fr/rss/news",
    source: "Transfermarkt",
    priority: 1,
  },

  // Football français & international
  {
    url: "https://rmcsport.bfmtv.com/rss/football/",
    source: "RMC Sport",
    priority: 2,
  },
  {
    url: "https://www.maxifoot.fr/rss.xml",
    source: "Maxifoot",
    priority: 2,
  },
];

// Limite : max 8 articles RSS par exécution (pour rester dans le timeout Vercel 300s)
const MAX_ARTICLES_PER_RUN = 8;

export async function GET(request: Request) {
  // Vérification CRON_SECRET
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let articlesGenerated = 0;
  const errors: string[] = [];

  // Trier les feeds par priorité
  const sortedFeeds = [...RSS_FEEDS].sort((a, b) => a.priority - b.priority);

  for (const feed of sortedFeeds) {
    if (articlesGenerated >= MAX_ARTICLES_PER_RUN) break;

    try {
      const items = await fetchRSSFeed(feed.url, feed.source);

      // Prendre les 5 articles les plus récents de chaque feed
      const recentItems = items.slice(0, 5);

      for (const item of recentItems) {
        if (articlesGenerated >= MAX_ARTICLES_PER_RUN) break;

        // Vérifier si déjà traité
        const alreadyDone = await isAlreadyProcessed(item.link);
        if (alreadyDone) continue;

        // Filtrer : ne traiter que les articles liés au football
        if (!isFootballRelated(item)) continue;

        // Générer l'article
        const articleId = await generateArticleFromRSS(item);
        if (articleId) articlesGenerated++;

        // Pause 2 secondes entre chaque article (rate limiting Claude API)
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      const msg = `Erreur feed ${feed.source}: ${error}`;
      console.error(msg);
      errors.push(msg);
      continue;
    }
  }

  return NextResponse.json({
    success: true,
    articlesGenerated,
    errors: errors.length > 0 ? errors : undefined,
    message: `${articlesGenerated} articles RSS générés`,
  });
}

function isFootballRelated(item: RSSItem): boolean {
  const text = `${item.title} ${item.summary}`.toLowerCase();
  const footballKeywords = [
    "football",
    "foot",
    "match",
    "but",
    "goal",
    "transfert",
    "mercato",
    "ligue",
    "champion",
    "coupe",
    "can",
    "afcon",
    "sélection",
    "entraîneur",
    "joueur",
    "club",
    "premier league",
    "la liga",
    "serie a",
    "bundesliga",
    "mls",
    "saudi",
    "stade",
    "supporter",
    "arbitre",
    "penalty",
    "carton",
    "ballon",
    "gardien",
    "attaquant",
    "défenseur",
    "milieu",
    "fifa",
    "uefa",
    "caf",
  ];
  return footballKeywords.some((keyword) => text.includes(keyword));
}
