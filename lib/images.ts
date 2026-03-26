import {
  ArticleImageInput,
  generateContextualQueries,
  selectBestImage,
  isImageContextual,
  detectContext,
} from "./image-queries";
import {
  PexelsPhoto,
  getCachedImages,
  setCachedImages,
  canMakeApiCall,
} from "./image-cache";

export interface ArticleImage {
  url: string;
  alt: string;
  credit: string;
  width: number;
  height: number;
  position: "featured" | "mid" | "end";
}

// ----- Pexels API -----

async function searchPexels(query: string): Promise<PexelsPhoto[]> {
  const cached = await getCachedImages(query);
  if (cached) return cached;

  if (!(await canMakeApiCall())) {
    console.warn("Pexels rate limit approaching, skipping API call");
    return [];
  }

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    console.error("PEXELS_API_KEY not set");
    return [];
  }

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`,
      { headers: { Authorization: apiKey } }
    );

    if (!res.ok) {
      console.error(`Pexels API error: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const photos: PexelsPhoto[] = data.photos || [];

    if (photos.length > 0) {
      await setCachedImages(query, photos);
    }

    return photos;
  } catch (err) {
    console.error("Pexels fetch error:", err);
    return [];
  }
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

// ----- Main function -----

export async function getArticleImages(
  input: ArticleImageInput
): Promise<ArticleImage[]> {
  const articleCtx = {
    title: input.title,
    content: "",
    teams: input.teams,
    league: input.league,
    tags: input.tags,
    type: input.type,
  };

  const queries = generateContextualQueries(articleCtx);
  const ctx = detectContext(articleCtx);
  const images: ArticleImage[] = [];

  for (const query of queries) {
    if (images.length >= 2) break; // Max 2 images par article

    const photos = await searchPexels(query);

    // Sélectionner la meilleure image avec scoring
    const best = selectBestImage(photos, ctx);
    if (!best) continue;

    // Vérification contextuelle — rejeter les images hors sport
    if (!isImageContextual(best, articleCtx)) {
      continue;
    }

    const position = images.length === 0 ? "featured" : "mid";

    images.push({
      url: (best.src.large2x || best.src.large).split("?")[0] + "?auto=compress&cs=tinysrgb&w=1200",
      alt: generateContextualAlt(input, position),
      credit: `Photo by ${best.photographer} on Pexels`,
      width: 1200,
      height: Math.round(1200 * (best.height / best.width)),
      position: position as "featured" | "mid",
    });
  }

  // Fallback si aucune image trouvée
  if (images.length === 0) {
    images.push({
      url: "/images/default-football.jpg",
      alt: `Football — ${input.league} | 360 Foot`,
      credit: "360 Foot",
      width: 1200,
      height: 675,
      position: "featured",
    });
  }

  return images;
}

// ----- HTML injection -----

function generateImgTag(image: ArticleImage): string {
  const loading = image.position === "featured" ? "eager" : "lazy";
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

  // Featured image: BEFORE the first paragraph
  const featured = images.find((img) => img.position === "featured");
  if (featured) {
    result += generateImgTag(featured);
  }

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
