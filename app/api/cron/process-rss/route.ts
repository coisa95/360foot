import { NextResponse } from "next/server";
import { fetchRSSFeed, isAlreadyProcessed } from "@/lib/rss-fetcher";
import { generateArticleFromRSS } from "@/lib/rss-generator";
import type { RSSItem } from "@/lib/rss-prompt";
import { verifyCronAuth } from "@/lib/auth";


export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface RSSFeed {
  url: string;
  source: string;
  priority: number;
  /** Si true, la source est désactivée (morte, bloquée ou parseur en panne). */
  disabled?: boolean;
}

const RSS_FEEDS: RSSFeed[] = [
  // ===== PRIORITÉ 1 : Football africain & diaspora =====
  {
    url: "https://www.africatopsports.com/feed/",
    source: "AfricaTopSports",
    priority: 1,
    // disabled 2026-04-20 : 403 Cloudflare depuis VPS prod (200 en local)
    disabled: true,
  },
  {
    url: "https://africafoot.com/feed/",
    source: "AfricaFoot",
    priority: 1,
    // disabled 2026-04-20 : échecs systématiques en prod (Cloudflare block)
    disabled: true,
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
    // disabled 2026-04-20 : 404 (flux supprimé)
    disabled: true,
  },
  {
    url: "https://www.bbc.com/africa/topics/cyx5krnw38rt/rss.xml",
    source: "BBC Africa Football",
    priority: 1,
    // disabled 2026-04-20 : 404 (topic ID obsolète)
    disabled: true,
  },
  {
    url: "https://allafrica.com/tools/headlines/rdf/sport.html",
    source: "AllAfrica Sports",
    priority: 1,
    // disabled 2026-04-20 : 404 (endpoint RDF retiré)
    disabled: true,
  },
  {
    url: "https://www.cafonline.com/rss",
    source: "CAF Online",
    priority: 1,
    // disabled 2026-04-20 : 404 (pas de flux RSS officiel)
    disabled: true,
  },
  {
    url: "https://www.supersport.com/football/rss",
    source: "Supersport Africa",
    priority: 1,
    // disabled 2026-04-20 : 404 après redirect (flux supprimé)
    disabled: true,
  },

  // ===== PRIORITÉ 1 : Transferts =====
  {
    url: "https://www.footmercato.net/feed",
    source: "Foot Mercato",
    priority: 1,
    // disabled 2026-04-20 : 404 sur /feed et /feed/ (pas dans l'audit mais détecté)
    disabled: true,
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
    // disabled 2026-04-20 : TypeError au parse (URL 200 mais XML problématique)
    disabled: true,
  },
  {
    url: "https://www.skysports.com/feeds/news/football",
    source: "Sky Sports",
    priority: 2,
    // disabled 2026-04-20 : 404
    disabled: true,
  },
  {
    url: "https://www.goal.com/en/rss?ICID=HP",
    source: "Goal",
    priority: 2,
    // disabled 2026-04-20 : 404 (Goal a supprimé ses flux RSS publics)
    disabled: true,
  },

  // ===== PRIORITÉ 2 : Médias espagnols =====
  {
    url: "https://www.marca.com/rss/futbol.html",
    source: "Marca",
    priority: 2,
    // disabled 2026-04-20 : 404
    disabled: true,
  },
  {
    url: "https://as.com/rss/futbol/",
    source: "AS",
    priority: 2,
    // disabled 2026-04-20 : 404
    disabled: true,
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
    // disabled 2026-04-20 : 404
    disabled: true,
  },
  {
    url: "https://www.bild.de/rssfeeds/sport/fussball-25085082,feed=rss.bild.xml",
    source: "Bild Football",
    priority: 2,
    // disabled 2026-04-20 : 404
    disabled: true,
  },
  {
    url: "https://www.sport1.de/de/rss/fussball",
    source: "Sport1",
    priority: 2,
    // disabled 2026-04-20 : redirect vers homepage (flux supprimé)
    disabled: true,
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
    // disabled 2026-04-20 : 404
    disabled: true,
  },
];

// Max 10 articles par exécution (Vercel 300s timeout)
const MAX_ARTICLES_PER_RUN = 15;

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let articlesGenerated = 0;
  const errors: string[] = [];
  const feedsProcessed: string[] = [];

  // Filtrer les sources désactivées (mortes / bloquées / parseur KO) puis trier par priorité
  const sortedFeeds = RSS_FEEDS
    .filter((f) => !f.disabled)
    .sort((a, b) => a.priority - b.priority);

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

        // Rate limiting LLM API
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
    totalFeeds: sortedFeeds.length,
    errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    message: `${articlesGenerated} articles RSS générés depuis ${feedsProcessed.length} sources`,
  });
}

function isFootballRelated(item: RSSItem): boolean {
  const text = `${item.title} ${item.summary}`.toLowerCase();

  // Exclure les autres sports en premier
  const excludeKeywords = [
    "nba", "basketball", "basket",
    "nfl", "american football", "touchdown", "quarterback",
    "nhl", "hockey", "ice hockey",
    "mlb", "baseball",
    "tennis", "roland garros", "wimbledon", "atp", "wta",
    "rugby", "top 14 rugby", "six nations rugby",
    "f1", "formula 1", "formule 1", "grand prix auto",
    "golf", "masters golf", "pga", "augusta",
    "boxe", "boxing", "ufc", "mma",
    "cyclisme", "tour de france vélo", "giro",
    "natation", "swimming", "athletics", "athlétisme",
    "cricket", "nascar", "handball",
    "esport", "league of legends", "valorant",
  ];
  if (excludeKeywords.some((kw) => text.includes(kw))) return false;

  const footballKeywords = [
    "football", "foot", "soccer", "fútbol", "fußball",
    "transfert", "mercato", "transfer", "fichaje", "traspaso",
    "ligue 1", "premier league", "la liga", "serie a", "bundesliga",
    "champions league", "ligue des champions", "europa league",
    "coupe du monde", "world cup", "copa america",
    "can", "afcon", "caf",
    "entraîneur", "joueur",
    "stade", "stadium", "estadio",
    "arbitre", "penalty", "carton rouge", "carton jaune",
    "gardien", "attaquant", "défenseur", "milieu de terrain",
    "fifa", "uefa",
    "striker", "midfielder", "defender", "goalkeeper",
    "ballon d'or",
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
