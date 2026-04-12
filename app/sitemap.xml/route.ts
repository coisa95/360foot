// Sitemap INDEX — pointe vers les sous-sitemaps
// Améliore le crawl budget Google sur domaine jeune
export const revalidate = 3600;

export function GET() {
  const baseUrl = "https://360-foot.com";
  const now = new Date().toISOString();

  const sitemaps = [
    "sitemap-static.xml",
    "sitemap-news.xml",
    "sitemap-articles.xml",
    "sitemap-matches.xml",
    "sitemap-leagues.xml",
    "sitemap-teams.xml",
    "sitemap-players.xml",
    "sitemap-pronostics.xml",
    "sitemap-confrontations.xml",
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
  .map(
    (s) => `  <sitemap>
    <loc>${baseUrl}/${s}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`
  )
  .join("\n")}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
