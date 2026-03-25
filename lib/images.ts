import { ArticleImageInput, generateImageQueries } from "./image-queries";
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
  // Check cache first
  const cached = await getCachedImages(query);
  if (cached) return cached;

  // Rate limit check
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
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`,
      {
        headers: { Authorization: apiKey },
      }
    );

    if (!res.ok) {
      console.error(`Pexels API error: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const photos: PexelsPhoto[] = data.photos || [];

    // Cache results
    if (photos.length > 0) {
      await setCachedImages(query, photos);
    }

    return photos;
  } catch (err) {
    console.error("Pexels fetch error:", err);
    return [];
  }
}

// ----- Image filtering -----

function filterImages(photos: PexelsPhoto[]): PexelsPhoto[] {
  return photos.filter((photo) => {
    // Landscape only
    if (photo.width < photo.height) return false;
    // Minimum 1200px wide
    if (photo.width < 1200) return false;
    // Aspect ratio between 16:9 and 2:1
    const ratio = photo.width / photo.height;
    if (ratio < 1.5 || ratio > 2.2) return false;
    return true;
  });
}

// ----- ALT text generation -----

function generateAltText(
  input: ArticleImageInput,
  position: string
): string {
  if (position === "featured") {
    if (input.teams.length === 2) {
      return `Match de football ${input.teams[0]} contre ${input.teams[1]} — ${input.league}`;
    }
    return `Actualité football ${input.league} — 360 Foot`;
  }

  if (position === "mid") {
    return `Ambiance de match de football — ${input.league}`;
  }

  return `Football — 360 Foot`;
}

// ----- Main function -----

export async function getArticleImages(
  input: ArticleImageInput
): Promise<ArticleImage[]> {
  const queries = generateImageQueries(input);
  const allPhotos: PexelsPhoto[] = [];
  const seenIds = new Set<number>();

  // Try queries in order until we have enough images
  for (const query of queries) {
    if (allPhotos.length >= 5) break;

    const photos = await searchPexels(query);
    const filtered = filterImages(photos);

    for (const photo of filtered) {
      if (!seenIds.has(photo.id)) {
        seenIds.add(photo.id);
        allPhotos.push(photo);
      }
    }
  }

  // If still no images, try generic fallback
  if (allPhotos.length === 0) {
    const fallbackPhotos = await searchPexels("football soccer");
    const filtered = filterImages(fallbackPhotos);
    allPhotos.push(...filtered);
  }

  // Determine how many images based on content length
  // Default to 2 images (featured + mid)
  const positions: ("featured" | "mid" | "end")[] = ["featured", "mid"];
  if (allPhotos.length >= 3) {
    positions.push("end");
  }

  const images: ArticleImage[] = [];

  for (let i = 0; i < Math.min(positions.length, allPhotos.length); i++) {
    const photo = allPhotos[i];
    const position = positions[i];

    images.push({
      url: `${photo.src.large2x || photo.src.large}?auto=compress&cs=tinysrgb&w=1200`,
      alt: generateAltText(input, position),
      credit: `Photo by ${photo.photographer} on Pexels`,
      width: 1200,
      height: Math.round((1200 / photo.width) * photo.height),
      position,
    });
  }

  // If absolutely no images found, use default
  if (images.length === 0) {
    images.push({
      url: "/images/default-football.jpg",
      alt: generateAltText(input, "featured"),
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

    // End image: after the second-to-last paragraph
    if (index === paragraphs.length - 3) {
      const end = images.find((img) => img.position === "end");
      if (end) {
        result += generateImgTag(end);
      }
    }
  });

  return result;
}

export type { ArticleImageInput } from "./image-queries";
