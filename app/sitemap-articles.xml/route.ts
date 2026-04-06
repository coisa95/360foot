import { createClient } from "@/lib/supabase";

// Sitemap articles avec pagination Supabase pour dépasser la limite de 1000
export const revalidate = 3600;

export async function GET() {
  const supabase = createClient();
  const baseUrl = "https://360-foot.com";

  // Pagination Supabase : récupère par batch de 1000 jusqu'à 50000 max
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allArticles: any[] = [];
  const batchSize = 1000;
  for (let offset = 0; offset < 50; offset++) {
    const { data, error } = await supabase
      .from("articles")
      .select("slug, published_at")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .range(offset * batchSize, (offset + 1) * batchSize - 1);
    if (error || !data || data.length === 0) break;
    allArticles.push(...data);
    if (data.length < batchSize) break;
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  for (const article of allArticles) {
    const lastmod = article.published_at;
    xml += `
  <url>
    <loc>${baseUrl}/actu/${article.slug}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
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
