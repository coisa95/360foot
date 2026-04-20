import { createAnonClient } from "@/lib/supabase";

export const revalidate = 3600;

export async function GET() {
  const supabase = createAnonClient();
  const baseUrl = "https://360-foot.com";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all: any[] = [];
  for (let offset = 0; offset < 10; offset++) {
    // Exclut les matchs sans aucune donnée JSON (thin content noindex).
    // Conserve : FT avec events/lineups/stats, ou NS avec predictions/h2h.
    const { data, error } = await supabase
      .from("matches")
      .select("slug, date, status, events_json, lineups_json, stats_json, predictions_json, h2h_json")
      .or(
        "events_json.not.is.null,lineups_json.not.is.null,stats_json.not.is.null,predictions_json.not.is.null,h2h_json.not.is.null"
      )
      .order("date", { ascending: false })
      .range(offset * 1000, (offset + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    all.push(...data);
    if (data.length < 1000) break;
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  for (const m of all) {
    xml += `
  <url>
    <loc>${baseUrl}/match/${m.slug}</loc>
    <lastmod>${new Date(m.date).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
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
