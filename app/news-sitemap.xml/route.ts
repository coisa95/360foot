import { createClient } from "@/lib/supabase";

export const revalidate = 3600;

export async function GET() {
  const supabase = createClient();

  // Google News sitemap: only articles from last 48 hours
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const { data: articles } = await supabase
    .from("articles")
    .select("slug, title, published_at, tags, type")
    .not("published_at", "is", null)
    .gte("published_at", twoDaysAgo.toISOString())
    .order("published_at", { ascending: false })
    .limit(1000);

  const baseUrl = "https://360-foot.com";

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">`;

  for (const article of articles || []) {
    const pubDate = new Date(article.published_at).toISOString();
    const keywords = (article.tags || []).slice(0, 10).join(", ");

    xml += `
  <url>
    <loc>${baseUrl}/actu/${article.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>360 Foot</news:name>
        <news:language>fr</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(article.title)}</news:title>
      ${keywords ? `<news:keywords>${escapeXml(keywords)}</news:keywords>` : ""}
    </news:news>
  </url>`;
  }

  xml += `
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
