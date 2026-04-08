import { createClient } from "@/lib/supabase";

export const revalidate = 3600;

export async function GET() {
  const supabase = createClient();
  const baseUrl = "https://360-foot.com";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all: any[] = [];
  for (let offset = 0; offset < 10; offset++) {
    // Exclut les joueurs sans stats_json (thin content noindex).
    const { data, error } = await supabase
      .from("players")
      .select("slug, created_at")
      .not("stats_json", "is", null)
      .range(offset * 1000, (offset + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    all.push(...data);
    if (data.length < 1000) break;
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  for (const p of all) {
    xml += `
  <url>
    <loc>${baseUrl}/joueur/${p.slug}</loc>
    ${p.created_at ? `<lastmod>${new Date(p.created_at).toISOString()}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
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
