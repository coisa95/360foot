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

  // ═══ PRIORITÉ 2 : Logos des équipes comme image header ═══
  if (images.length === 0 && input.homeTeamLogo && input.awayTeamLogo) {
    // Use the dynamic OG image which will render team logos
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

  // ═══ PRIORITÉ 3 : Image OG dynamique (toujours unique par article) ═══
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
