import {
  ArticleImageInput,
} from "./image-queries";

export interface ArticleImage {
  url: string;
  alt: string;
  credit: string;
  width: number;
  height: number;
  position: "featured" | "mid" | "end";
}

// ----- ALT text contextuel en français -----

function generateContextualAlt(
  input: ArticleImageInput,
  position: string
): string {
  if (input.teams.length >= 2 && position === "featured") {
    return `${input.teams[0]} contre ${input.teams[1]} — ${input.league} | 360 Foot`;
  }
  if (input.teams.length === 1) {
    return `${input.teams[0]} — ${input.league} | 360 Foot`;
  }
  if (position === "featured") {
    return `${input.league} — Actualité football | 360 Foot`;
  }
  return `Ambiance football ${input.league} | 360 Foot`;
}

// ----- Build OG image URL with team logos -----

function buildOgImageUrl(input: ArticleImageInput): string {
  const params = new URLSearchParams();
  params.set("title", input.title);
  params.set("type", input.type || "result");
  if (input.league) params.set("league", input.league);
  if (input.homeTeamLogo) params.set("homeLogo", input.homeTeamLogo);
  if (input.awayTeamLogo) params.set("awayLogo", input.awayTeamLogo);
  if (input.leagueLogo) params.set("leagueLogo", input.leagueLogo);
  return `/api/og?${params.toString()}`;
}

// ----- Main function -----

export async function getArticleImages(
  input: ArticleImageInput
): Promise<ArticleImage[]> {
  const images: ArticleImage[] = [];

  // ═══ PRIORITÉ 0 : Image du flux RSS source ═══
  if (input.rssImageUrl) {
    images.push({
      url: input.rssImageUrl,
      alt: generateContextualAlt(input, "featured"),
      credit: "Source",
      width: 1200,
      height: 675,
      position: "featured",
    });
  }

  // ═══ PRIORITÉ 1 : Photo du stade (venue) depuis API-Football ═══
  if (images.length === 0 && input.venuePhotoUrl) {
    const venueLabel = input.venueName
      ? `${input.venueName}${input.venueCity ? `, ${input.venueCity}` : ""}`
      : "Stade";
    const altText =
      input.teams.length >= 2
        ? `${venueLabel} — ${input.teams[0]} vs ${input.teams[1]} | 360 Foot`
        : `${venueLabel} — ${input.league} | 360 Foot`;

    images.push({
      url: input.venuePhotoUrl,
      alt: altText,
      credit: `Photo du stade : API-Football`,
      width: 1200,
      height: 675,
      position: "featured",
    });
  }

  // ═══ PRIORITÉ 2 : Image par défaut de la ligue ═══
  if (images.length === 0) {
    const leagueImage = getLeagueDefaultImage(input.league);
    if (leagueImage) {
      images.push({
        url: leagueImage,
        alt: generateContextualAlt(input, "featured"),
        credit: "360 Foot",
        width: 1200,
        height: 675,
        position: "featured",
      });
    }
  }

  // ═══ PRIORITÉ 3 : Image OG dynamique (dernier fallback) ═══
  if (images.length === 0) {
    const ogUrl = buildOgImageUrl(input);
    images.push({
      url: ogUrl,
      alt: generateContextualAlt(input, "featured"),
      credit: "360 Foot",
      width: 1200,
      height: 630,
      position: "featured",
    });
  }

  // ═══ IMAGE MID-ARTICLE : Photo du buteur depuis API-Football ═══
  if (input.goalScorerPhotos && input.goalScorerPhotos.length > 0) {
    const scorer = input.goalScorerPhotos[0];
    // API-Football player photos are small (50x50), use them only if valid
    if (scorer.photo && !scorer.photo.includes("placeholder")) {
      images.push({
        url: scorer.photo,
        alt: `${scorer.name} (${scorer.team}) — Buteur du match | 360 Foot`,
        credit: `Photo : API-Football`,
        width: 200,
        height: 200,
        position: "mid",
      });
    }
  }

  return images;
}

// ----- League default images -----

export const LEAGUE_IMAGES: Record<string, string> = {
  "Ligue 1": "/images/leagues/ligue-1-france.jpg",
  "Ligue 1 Côte d'Ivoire": "/images/leagues/ligue-1-cote-divoire.jpg",
  "Ligue Pro Sénégal": "/images/leagues/ligue-pro-senegal.jpg",
  "Elite One Cameroun": "/images/leagues/elite-one-cameroun.jpg",
  "CAN": "/images/leagues/can.jpg",
  "CAF Champions League": "/images/leagues/caf-champions-league.jpg",
  "Primus Ligue Mali": "/images/leagues/primus-ligue-mali.jpg",
  "Fasofoot": "/images/leagues/fasofoot-burkina-faso.jpg",
  "Championnat National Bénin": "/images/leagues/championnat-benin.jpg",
  "Premier League": "/images/leagues/premier-league.jpg",
  "La Liga": "/images/leagues/la-liga.jpg",
  "Serie A": "/images/leagues/serie-a.jpg",
  "Bundesliga": "/images/leagues/bundesliga.jpg",
  "Champions League": "/images/leagues/champions-league.jpg",
  "Europa League": "/images/leagues/europa-league.jpg",
  "Conference League": "/images/leagues/conference-league.jpg",
  "MLS": "/images/leagues/mls.jpg",
  "Saudi Pro League": "/images/leagues/saudi-pro-league.jpg",
  "Coupe du Monde": "/images/leagues/coupe-du-monde.jpg",
  "Qualifs CdM Afrique": "/images/leagues/qualifs-cdm.jpg",
  "Qualifs CdM Europe": "/images/leagues/qualifs-cdm.jpg",
  "Qualifs CdM Amérique Sud": "/images/leagues/qualifs-cdm.jpg",
  "Matchs Amicaux": "/images/leagues/matchs-amicaux.jpg",
  "AFC Champions League": "/images/leagues/afc-champions-league.jpg",
  "AFC Cup": "/images/leagues/afc-cup.jpg",
  "CONCACAF Champions League": "/images/leagues/concacaf-champions-league.jpg",
  "CONCACAF Gold Cup": "/images/leagues/concacaf-gold-cup.jpg",
  "CONCACAF League": "/images/leagues/concacaf-league.jpg",
  "Copa America": "/images/leagues/copa-america.jpg",
  "Copa Libertadores": "/images/leagues/copa-libertadores.jpg",
  "Copa Sudamericana": "/images/leagues/copa-sudamericana.jpg",
  "Coupe d'Asie": "/images/leagues/coupe-asie.jpg",
  "Coupe de la Confédération CAF": "/images/leagues/coupe-confederation-caf.jpg",
  "Euro": "/images/leagues/euro.jpg",
  "Linafoot Ligue 1": "/images/leagues/linafoot-ligue-1.jpg",
  "Mercato": "/images/leagues/generic.jpg",
  "Football Africain": "/images/leagues/can.jpg",
  "Football": "/images/leagues/generic.jpg",
};

function getLeagueDefaultImage(league: string): string | null {
  return LEAGUE_IMAGES[league] || LEAGUE_IMAGES["Football"] || null;
}

// ----- Build OG URL for og_image_url field -----

export function buildArticleOgUrl(input: {
  title: string;
  type: string;
  league: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  leagueLogo?: string;
  venuePhotoUrl?: string;
}): string {
  // If we have a venue photo, use it directly as OG image
  if (input.venuePhotoUrl) {
    return input.venuePhotoUrl;
  }
  // Otherwise use dynamic OG generator
  const params = new URLSearchParams();
  params.set("title", input.title);
  params.set("type", input.type || "result");
  if (input.league) params.set("league", input.league);
  if (input.homeTeamLogo) params.set("homeLogo", input.homeTeamLogo);
  if (input.awayTeamLogo) params.set("awayLogo", input.awayTeamLogo);
  if (input.leagueLogo) params.set("leagueLogo", input.leagueLogo);
  return `/api/og?${params.toString()}`;
}

// ----- HTML injection -----

function generateImgTag(image: ArticleImage): string {
  const loading = image.position === "featured" ? "eager" : "lazy";

  // For player photos (small), use a centered card style
  if (image.width <= 200) {
    return `
    <figure class="article-image" style="text-align: center; margin: 1.5em auto;">
      <img
        src="${image.url}"
        alt="${image.alt}"
        width="${image.width}"
        height="${image.height}"
        loading="${loading}"
        decoding="async"
        style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid #84cc16; margin: 0 auto;"
      />
      <figcaption style="font-size: 12px; color: #6B7280; margin-top: 8px; text-align: center;">
        ${image.credit}
      </figcaption>
    </figure>
  `;
  }

  return `
    <figure class="article-image">
      <img
        src="${image.url}"
        alt="${image.alt}"
        width="${image.width}"
        height="${image.height}"
        loading="${loading}"
        decoding="async"
        style="width: 100%; height: auto; border-radius: 8px;"
      />
      <figcaption style="font-size: 12px; color: #6B7280; margin-top: 4px; text-align: center;">
        ${image.credit}
      </figcaption>
    </figure>
  `;
}

export function injectImagesIntoHTML(
  html: string,
  images: ArticleImage[]
): string {
  const paragraphs = html.split("</p>");

  if (paragraphs.length < 2) {
    const featured = images.find((img) => img.position === "featured");
    if (featured) {
      return generateImgTag(featured) + html;
    }
    return html;
  }

  let result = "";

  // Featured image: SKIP injection — displayed by the page template via og_image_url
  // Only mid/end images are injected into the HTML content

  paragraphs.forEach((para, index) => {
    if (index === paragraphs.length - 1 && para.trim() === "") return;
    result += para + "</p>";

    // Mid-article image: after the 2nd paragraph
    if (index === 1) {
      const mid = images.find((img) => img.position === "mid");
      if (mid) {
        result += generateImgTag(mid);
      }
    }
  });

  return result;
}

export type { ArticleImageInput } from "./image-queries";
