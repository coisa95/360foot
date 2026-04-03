export function GET() {
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /actu?
Disallow: /matchs?
Disallow: /ligue/*/calendrier?
Disallow: /ligue/*/resultats?
Disallow: /recherche
Disallow: /classement/
Disallow: /resultats

User-agent: Googlebot
Allow: /
Disallow: /api/
Disallow: /actu?
Disallow: /matchs?
Disallow: /ligue/*/calendrier?
Disallow: /ligue/*/resultats?
Disallow: /recherche
Disallow: /classement/
Disallow: /resultats

Sitemap: https://360-foot.com/sitemap.xml
`;

  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
