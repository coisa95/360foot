export function GET() {
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /actu?page=
Disallow: /actu?categorie=*&page=

User-agent: Googlebot
Allow: /
Disallow: /api/
Disallow: /actu?page=
Disallow: /actu?categorie=*&page=

User-agent: Bingbot
Allow: /
Disallow: /api/
Disallow: /actu?page=
Disallow: /actu?categorie=*&page=

Sitemap: https://360foot.info/sitemap.xml
Sitemap: https://360foot.info/news-sitemap.xml
`;

  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
