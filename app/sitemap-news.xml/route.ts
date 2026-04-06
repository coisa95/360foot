import { createClient } from "@/lib/supabase";

// Google News sitemap : articles publiés dans les 48 dernières heures
// Boost massif d'indexation pour les news fraîches
export const revalidate = 600;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const supabase = createClient();
  const baseUrl = "https://360-foot.com";

  // Articles publiés depuis 48h max (limite Google News)
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { data: articles } = await supabase
    .from("articles")
    .select("slug, title, published_at")
    .not("published_at", "is", null)
    .gte("published_at", cutoff)
    .order("published_at", { ascending: false })
    .limit(1000);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">`;

  if (articles) {
    for (const article of articles) {
      const pubDate = new Date(article.published_at).toISOString();
      xml += `
  <url>
    <loc>${baseUrl}/actu/${article.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>360 Foot</news:name>
        <news:language>fr</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(article.title || "")}</news:title>
    </news:news>
  </url>`;
    }
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
