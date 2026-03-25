export function GET() {
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://360-foot.com/sitemap.xml
`;

  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
