import express from "express";
import sharp from "sharp";

const app = express();
const PORT = process.env.PORT || 3001;

// In-memory cache (key → PNG buffer)
const cache = new Map<string, { buffer: Buffer; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

// ---------- Fetch remote image as base64 ----------

async function fetchImageBase64(url: string): Promise<string> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return "";
    const buf = Buffer.from(await res.arrayBuffer());
    const mime = res.headers.get("content-type") || "image/png";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return "";
  }
}

// ---------- Build match SVG (diagonal VS layout) ----------

function buildMatchSvg(params: {
  homeLogo: string;
  awayLogo: string;
  league: string;
  leagueLogo: string;
}): string {
  const { homeLogo, awayLogo, league, leagueLogo } = params;

  const leagueBadge = league
    ? `<g>
        <rect x="440" y="570" width="${Math.max(320, league.length * 14 + 60)}" height="44" rx="22" fill="rgba(15,23,42,0.88)"/>
        ${leagueLogo ? `<image href="${leagueLogo}" x="460" y="580" width="24" height="24" preserveAspectRatio="xMidYMid meet"/>` : ""}
        <text x="${leagueLogo ? "494" : "460"}" y="598" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600" fill="#ffffff" dominant-baseline="middle">${escapeXml(league)}</text>
      </g>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <clipPath id="right-diagonal">
      <polygon points="480,0 1200,0 1200,630 880,630"/>
    </clipPath>
  </defs>

  <!-- Left background (teal) -->
  <rect width="1200" height="630" fill="#0891b2"/>

  <!-- Right background (light) with diagonal clip -->
  <rect width="1200" height="630" fill="#f0f9ff" clip-path="url(#right-diagonal)"/>

  <!-- Home team logo (left) -->
  ${homeLogo ? `<image href="${homeLogo}" x="110" y="165" width="260" height="260" preserveAspectRatio="xMidYMid meet"/>` : ""}

  <!-- Away team logo (right) -->
  ${awayLogo ? `<image href="${awayLogo}" x="830" y="165" width="260" height="260" preserveAspectRatio="xMidYMid meet"/>` : ""}

  <!-- VS circle -->
  <circle cx="600" cy="300" r="48" fill="#ffffff" stroke="#e2e8f0" stroke-width="3"/>
  <text x="600" y="300" text-anchor="middle" dominant-baseline="central" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="bold" fill="#0f172a">VS</text>

  <!-- 360 Foot branding (top left) -->
  <circle cx="44" cy="36" r="20" fill="#84cc16"/>
  <text x="44" y="36" text-anchor="middle" dominant-baseline="central" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="bold" fill="#0f172a">360</text>
  <text x="74" y="43" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="bold" fill="#ffffff">360 Foot</text>

  <!-- League badge (bottom center) -->
  ${leagueBadge}
</svg>`;
}

// ---------- Build article SVG (title layout) ----------

function buildArticleSvg(params: {
  title: string;
  type: string;
  league: string;
}): string {
  const { title, type, league } = params;

  const typeLabel =
    type === "preview"
      ? "AVANT-MATCH"
      : type === "transfer"
        ? "TRANSFERT"
        : type === "trending"
          ? "ACTUALIT\u00c9"
          : "R\u00c9SULTAT";

  const fontSize = title.length > 60 ? 42 : 56;
  const wrappedTitle = wrapText(title, fontSize === 42 ? 38 : 28);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow1" cx="1" cy="0" r="0.5">
      <stop offset="0%" stop-color="rgba(132,204,22,0.15)"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
    <radialGradient id="glow2" cx="0" cy="1" r="0.5">
      <stop offset="0%" stop-color="rgba(8,145,178,0.15)"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="#0f172a"/>
  <rect width="600" height="600" x="700" y="-100" fill="url(#glow1)"/>
  <rect width="500" height="500" x="-100" y="300" fill="url(#glow2)"/>

  <!-- 360 Foot branding -->
  <circle cx="84" cy="65" r="26" fill="#84cc16"/>
  <text x="84" y="65" text-anchor="middle" dominant-baseline="central" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="bold" fill="#0f172a">360</text>
  <text x="122" y="73" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="bold" fill="#ffffff">360 Foot</text>

  <!-- Type badge -->
  <rect x="1010" y="45" width="${typeLabel.length * 12 + 40}" height="40" rx="20" fill="#84cc16"/>
  <text x="${1010 + (typeLabel.length * 12 + 40) / 2}" y="70" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="bold" fill="#0f172a">${typeLabel}</text>

  <!-- Title -->
  ${wrappedTitle
    .map(
      (line, i) =>
        `<text x="60" y="${240 + i * (fontSize + 10)}" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="bold" fill="#ffffff">${escapeXml(line)}</text>`
    )
    .join("\n  ")}

  <!-- Bottom bar -->
  <line x1="60" y1="540" x2="1140" y2="540" stroke="#84cc16" stroke-width="2"/>
  ${league ? `<text x="60" y="575" font-family="system-ui, -apple-system, sans-serif" font-size="22" fill="#94a3b8">${escapeXml(league)}</text>` : ""}
  <text x="1140" y="575" text-anchor="end" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="#64748b">360-foot.com</text>
</svg>`;
}

// ---------- Helpers ----------

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if ((current + " " + word).trim().length > maxCharsPerLine && current) {
      lines.push(current.trim());
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (current) lines.push(current.trim());
  return lines.slice(0, 4); // max 4 lines
}

// ---------- Route ----------

app.get("/api/og", async (req, res) => {
  try {
    const title = (req.query.title as string) || "360 Foot";
    const type = (req.query.type as string) || "result";
    const league = (req.query.league as string) || "";
    const homeLogo = (req.query.homeLogo as string) || "";
    const awayLogo = (req.query.awayLogo as string) || "";
    const leagueLogo = (req.query.leagueLogo as string) || "";

    // Cache key
    const cacheKey = `${title}|${type}|${league}|${homeLogo}|${awayLogo}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800");
      res.setHeader("X-Cache", "HIT");
      return res.send(cached.buffer);
    }

    const hasLogos = !!(homeLogo && awayLogo);
    let svg: string;

    if (hasLogos) {
      // Fetch team logos as base64 for embedding in SVG
      const [homeB64, awayB64, leagueB64] = await Promise.all([
        fetchImageBase64(homeLogo),
        fetchImageBase64(awayLogo),
        leagueLogo ? fetchImageBase64(leagueLogo) : Promise.resolve(""),
      ]);

      svg = buildMatchSvg({
        homeLogo: homeB64 || homeLogo,
        awayLogo: awayB64 || awayLogo,
        league,
        leagueLogo: leagueB64,
      });
    } else {
      svg = buildArticleSvg({ title, type, league });
    }

    // Convert SVG to PNG via sharp
    const pngBuffer = await sharp(Buffer.from(svg))
      .resize(1200, 630)
      .png({ quality: 90 })
      .toBuffer();

    // Cache
    cache.set(cacheKey, { buffer: pngBuffer, timestamp: Date.now() });

    // Evict old entries if cache grows too large
    if (cache.size > 500) {
      const oldest = [...cache.entries()].sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      );
      for (let i = 0; i < 100; i++) cache.delete(oldest[i][0]);
    }

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800");
    res.setHeader("X-Cache", "MISS");
    res.send(pngBuffer);
  } catch (error) {
    console.error("OG generation error:", error);
    res.status(500).send("Failed to generate image");
  }
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", cache_size: cache.size });
});

app.listen(PORT, () => {
  console.log(`OG image service running on port ${PORT}`);
});
