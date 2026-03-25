import { Metadata } from "next";

interface ArticleSeoInput {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  modifiedAt?: string;
  image?: string;
  authorName?: string;
}

interface MatchSeoInput {
  homeTeam: string;
  awayTeam: string;
  league: string;
  date: string;
  slug: string;
  description?: string;
}

interface TeamSeoInput {
  name: string;
  slug: string;
  league?: string;
  description?: string;
  image?: string;
}

interface LeagueSeoInput {
  name: string;
  slug: string;
  country: string;
  description?: string;
  image?: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://360foot.com";
const SITE_NAME = "360Foot";

/**
 * Generate Next.js Metadata for different page types.
 */
export function generateMetadata(
  type: "article",
  input: ArticleSeoInput
): Metadata;
export function generateMetadata(type: "match", input: MatchSeoInput): Metadata;
export function generateMetadata(type: "team", input: TeamSeoInput): Metadata;
export function generateMetadata(
  type: "league",
  input: LeagueSeoInput
): Metadata;
export function generateMetadata(
  type: "article" | "match" | "team" | "league",
  input: ArticleSeoInput | MatchSeoInput | TeamSeoInput | LeagueSeoInput
): Metadata {
  switch (type) {
    case "article": {
      const a = input as ArticleSeoInput;
      return {
        title: `${a.title} | ${SITE_NAME}`,
        description: a.description,
        openGraph: {
          title: a.title,
          description: a.description,
          url: `${SITE_URL}/${a.slug}`,
          siteName: SITE_NAME,
          type: "article",
          publishedTime: a.publishedAt,
          modifiedTime: a.modifiedAt,
          images: a.image ? [{ url: a.image, width: 1200, height: 630 }] : [],
        },
        twitter: {
          card: "summary_large_image",
          title: a.title,
          description: a.description,
          images: a.image ? [a.image] : [],
        },
        alternates: {
          canonical: `${SITE_URL}/${a.slug}`,
        },
      };
    }
    case "match": {
      const m = input as MatchSeoInput;
      const title = `${m.homeTeam} vs ${m.awayTeam} - ${m.league}`;
      const description =
        m.description ||
        `${m.homeTeam} vs ${m.awayTeam} en ${m.league}. Suivez le match en direct, les stats et les compositions.`;
      return {
        title: `${title} | ${SITE_NAME}`,
        description,
        openGraph: {
          title,
          description,
          url: `${SITE_URL}/match/${m.slug}`,
          siteName: SITE_NAME,
          type: "website",
        },
        twitter: {
          card: "summary",
          title,
          description,
        },
        alternates: {
          canonical: `${SITE_URL}/match/${m.slug}`,
        },
      };
    }
    case "team": {
      const t = input as TeamSeoInput;
      const title = t.league ? `${t.name} - ${t.league}` : t.name;
      const description =
        t.description ||
        `Toute l'actualite de ${t.name}. Resultats, classement, effectif et transferts.`;
      return {
        title: `${title} | ${SITE_NAME}`,
        description,
        openGraph: {
          title,
          description,
          url: `${SITE_URL}/equipe/${t.slug}`,
          siteName: SITE_NAME,
          type: "website",
          images: t.image ? [{ url: t.image }] : [],
        },
        twitter: {
          card: "summary",
          title,
          description,
        },
        alternates: {
          canonical: `${SITE_URL}/equipe/${t.slug}`,
        },
      };
    }
    case "league": {
      const l = input as LeagueSeoInput;
      const title = `${l.name} - ${l.country}`;
      const description =
        l.description ||
        `Suivez la ${l.name} (${l.country}). Classement, resultats, calendrier et actualites.`;
      return {
        title: `${title} | ${SITE_NAME}`,
        description,
        openGraph: {
          title,
          description,
          url: `${SITE_URL}/ligue/${l.slug}`,
          siteName: SITE_NAME,
          type: "website",
          images: l.image ? [{ url: l.image }] : [],
        },
        twitter: {
          card: "summary",
          title,
          description,
        },
        alternates: {
          canonical: `${SITE_URL}/ligue/${l.slug}`,
        },
      };
    }
  }
}

/**
 * Generate JSON-LD structured data for Schema.org types.
 */
export function generateJsonLd(
  type: "NewsArticle",
  data: {
    title: string;
    description: string;
    slug: string;
    publishedAt: string;
    modifiedAt?: string;
    image?: string;
    authorName?: string;
  }
): Record<string, unknown>;
export function generateJsonLd(
  type: "SportsEvent",
  data: {
    homeTeam: string;
    awayTeam: string;
    league: string;
    date: string;
    venue?: string;
    slug: string;
    homeScore?: number;
    awayScore?: number;
  }
): Record<string, unknown>;
export function generateJsonLd(
  type: "BreadcrumbList",
  data: {
    items: { name: string; url: string }[];
  }
): Record<string, unknown>;
export function generateJsonLd(
  type: "NewsArticle" | "SportsEvent" | "BreadcrumbList",
  data: Record<string, unknown>
): Record<string, unknown> {
  switch (type) {
    case "NewsArticle": {
      const d = data as {
        title: string;
        description: string;
        slug: string;
        publishedAt: string;
        modifiedAt?: string;
        image?: string;
        authorName?: string;
      };
      return {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: d.title,
        description: d.description,
        url: `${SITE_URL}/${d.slug}`,
        datePublished: d.publishedAt,
        dateModified: d.modifiedAt || d.publishedAt,
        image: d.image || undefined,
        author: {
          "@type": "Organization",
          name: d.authorName || SITE_NAME,
        },
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          url: SITE_URL,
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `${SITE_URL}/${d.slug}`,
        },
      };
    }
    case "SportsEvent": {
      const d = data as {
        homeTeam: string;
        awayTeam: string;
        league: string;
        date: string;
        venue?: string;
        slug: string;
        homeScore?: number;
        awayScore?: number;
      };
      return {
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        name: `${d.homeTeam} vs ${d.awayTeam}`,
        description: `${d.homeTeam} vs ${d.awayTeam} - ${d.league}`,
        startDate: d.date,
        url: `${SITE_URL}/match/${d.slug}`,
        location: d.venue
          ? {
              "@type": "Place",
              name: d.venue,
            }
          : undefined,
        homeTeam: {
          "@type": "SportsTeam",
          name: d.homeTeam,
        },
        awayTeam: {
          "@type": "SportsTeam",
          name: d.awayTeam,
        },
        competitor: [
          { "@type": "SportsTeam", name: d.homeTeam },
          { "@type": "SportsTeam", name: d.awayTeam },
        ],
      };
    }
    case "BreadcrumbList": {
      const d = data as { items: { name: string; url: string }[] };
      return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: d.items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
        })),
      };
    }
  }
}
