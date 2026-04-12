import { createClient } from "@/lib/supabase";

export const revalidate = 3600;

export async function GET() {
  const supabase = createClient();
  const baseUrl = "https://360-foot.com";

  // Only upcoming matches with predictions data
  const { data: matches } = await supabase
    .from("matches")
    .select("slug, date")
    .eq("status", "NS")
    .not("predictions_json", "is", null)
    .order("date", { ascending: true })
    .limit(500);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  for (const m of matches || []) {
    xml += `
  <url>
    <loc>${baseUrl}/pronostic/${m.slug}</loc>
    <lastmod>${new Date(m.date).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
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
