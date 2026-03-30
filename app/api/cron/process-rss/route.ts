import { NextResponse } from "next/server";
import { fetchRSSFeed, isAlreadyProcessed } from "@/lib/rss-fetcher";
import { generateArticleFromRSS } from "@/lib/rss-generator";
import type { RSSItem } from "@/lib/rss-prompt";
import { verifyCronAuth } from "@/lib/auth";

export const maxDuration = 300;

const RSS_FEEDS = [
  // ===== PRIORITÉ 1 : Football africain & diaspora =====
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
  {
    url: "https://footafrica365.fr/rss/",
    source: "Foot Afrique",
    priority: 1,
  },
  {
    url: "https://www.jeuneafrique.com/sports/rss/",
    source: "Jeune Afrique Sport",
    priority: 1,
  },
  {
    url: "https://www.bbc.com/africa/topics/cyx5krnw38rt/rss.xml",
    source: "BBC Africa Football",
    priority: 1,
  },
  {
    url: "https://allafrica.com/tools/headlines/rdf/sport.html",
    source: "AllAfrica Sports",
    priority: 1,
  },
  {
    url: "https://www.cafonline.com/rss",
    source: "CAF Online",
    priority: 1,
  },
  {
    url: "https://www.supersport.com/football/rss",
    source: "Supersport Africa",
    priority: 1,
  },

  // ===== PRIORITÉ 1 : Transferts =====
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

  // ===== PRIORITÉ 1 : Data & Analytics =====
  {
    url: "https://theanalyst.com/feed/",
    source: "The Analyst (Opta)",
    priority: 1,
  },

  // ===== PRIORITÉ 2 : Médias anglais =====
  {
    url: "http://feeds.bbci.co.uk/sport/football/rss.xml",
    source: "BBC Sport",
    priority: 2,
  },
  {
    url: "https://www.theguardian.com/football/rss",
    source: "The Guardian Football",
    priority: 2,
  },
  {
    url: "https://www.skysports.com/feeds/news/football",
    source: "Sky Sports",
    priority: 2,
  },
  {
    url: "https://www.goal.com/en/rss?ICID=HP",
    source: "Goal",
    priority: 2,
  },

  // ===== PRIORITÉ 2 : Médias espagnols =====
  {
    url: "https://www.marca.com/rss/futbol.html",
    source: "Marca",
    priority: 2,
  },
  {
    url: "https://as.com/rss/futbol/",
    source: "AS",
    priority: 2,
  },
  {
    url: "https://www.mundodeportivo.com/rss/futbol",
    source: "Mundo Deportivo",
    priority: 2,
  },

  // ===== PRIORITÉ 2 : Médias allemands =====
  {
    url: "https://www.kicker.de/news/fussball/bundesliga/rss.xml",
    source: "Kicker",
    priority: 2,
  },
  {
    url: "https://www.bild.de/rssfeeds/sport/fussball-25085082,feed=rss.bild.xml",
    source: "Bild Football",
    priority: 2,
  },
  {
    url: "https://www.sport1.de/de/rss/fussball",
    source: "Sport1",
    priority: 2,
  },

  // ===== PRIORITÉ 3 : Médias français généralistes =====
  {
    url: "https://rmcsport.bfmtv.com/rss/football/",
    source: "RMC Sport",
    priority: 3,
  },
  {
    url: "https://www.maxifoot.fr/rss.xml",
    source: "Maxifoot",
    priority: 3,
  },
];

// Max 10 articles par exécution (Vercel 300s timeout)
const MAX_ARTICLES_PER_RUN = 10;

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let articlesGenerated = 0;
  const errors: string[] = [];
  const feedsProcessed: string[] = [];

  // Trier par priorité
  const sortedFeeds = [...RSS_FEEDS].sort((a, b) => a.priority - b.priority);

  for (const feed of sortedFeeds) {
    if (articlesGenerated >= MAX_ARTICLES_PER_RUN) break;

    try {
      const items = await fetchRSSFeed(feed.url, feed.source);
      if (items.length === 0) continue;

      // 5 articles les plus récents par feed
      const recentItems = items.slice(0, 5);
      let feedGenerated = 0;

      for (const item of recentItems) {
        if (articlesGenerated >= MAX_ARTICLES_PER_RUN) break;
        // Max 2 articles par feed pour diversifier les sources
        if (feedGenerated >= 2) break;

        const alreadyDone = await isAlreadyProcessed(item.link);
        if (alreadyDone) continue;

        if (!isFootballRelated(item)) continue;

        // Bonus : prioriser les articles sur les joueurs/ligues africains
        const priority = getArticlePriority(item);
        if (feed.priority >= 3 && priority === "low") continue;

        const articleId = await generateArticleFromRSS(item);
        if (articleId) {
          articlesGenerated++;
          feedGenerated++;
        }

        // Rate limiting Claude API
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      if (feedGenerated > 0) feedsProcessed.push(feed.source);
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
    feedsProcessed,
    totalFeeds: RSS_FEEDS.length,
    errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    message: `${articlesGenerated} articles RSS générés depuis ${feedsProcessed.length} sources`,
  });
}

function isFootballRelated(item: RSSItem): boolean {
  const text = `${item.title} ${item.summary}`.toLowerCase();
  const footballKeywords = [
    "football", "foot", "soccer", "fútbol", "fußball",
    "match", "but", "goal", "gol", "tor",
    "transfert", "mercato", "transfer", "fichaje", "traspaso",
    "ligue", "league", "liga", "serie a", "bundesliga",
    "champion", "coupe", "cup", "copa", "pokal",
    "can", "afcon", "caf",
    "sélection", "entraîneur", "joueur", "club",
    "premier league", "la liga", "mls", "saudi",
    "stade", "stadium", "estadio",
    "arbitre", "penalty", "carton",
    "ballon", "gardien", "attaquant", "défenseur", "milieu",
    "fifa", "uefa", "fussball",
    // Termes spécifiques pour les sources non-francophones
    "striker", "midfielder", "defender", "goalkeeper",
    "relegation", "promotion", "playoff",
  ];
  return footballKeywords.some((keyword) => text.includes(keyword));
}

// Score de priorité pour prioriser les sujets les plus pertinents
function getArticlePriority(item: RSSItem): "high" | "medium" | "low" {
  const text = `${item.title} ${item.summary}`.toLowerCase();

  const highPriorityTerms = [
    // Joueurs/ligues africains
    "afrique", "africa", "africain", "african",
    "can", "afcon", "caf",
    "sénégal", "senegal", "côte d'ivoire", "ivory coast", "cameroun", "cameroon",
    "nigeria", "ghana", "mali", "maroc", "morocco", "algérie", "algeria",
    "egypte", "egypt", "tunisie", "tunisia", "congo", "bénin", "benin",
    "burkina", "guinée", "guinea",
    // Transferts
    "transfert", "mercato", "transfer", "fichaje", "signing",
    // Grandes compétitions
    "champions league", "ligue des champions", "europa league",
    "coupe du monde", "world cup",
  ];

  const mediumPriorityTerms = [
    "ligue 1", "premier league", "la liga", "serie a", "bundesliga",
    "résultat", "classement", "score", "victoire", "défaite",
  ];

  if (highPriorityTerms.some((t) => text.includes(t))) return "high";
  if (mediumPriorityTerms.some((t) => text.includes(t))) return "medium";
  return "low";
}
