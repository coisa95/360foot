import { createClient } from "@/lib/supabase";

export const revalidate = 3600;

export async function GET() {
  const supabase = createClient();
  const baseUrl = "https://360-foot.com";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all: any[] = [];
  for (let offset = 0; offset < 5; offset++) {
    const { data, error } = await supabase
      .from("leagues")
      .select("slug, created_at")
      .range(offset * 1000, (offset + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    all.push(...data);
    if (data.length < 1000) break;
  }

  const subPages = ["resultats", "calendrier", "actualites", "buteurs", "passeurs"];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  for (const league of all) {
    const lastmod = league.created_at
      ? `<lastmod>${new Date(league.created_at).toISOString()}</lastmod>`
      : "";
    xml += `
  <url>
    <loc>${baseUrl}/ligue/${league.slug}</loc>
    ${lastmod}
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    for (const sub of subPages) {
      xml += `
  <url>
    <loc>${baseUrl}/ligue/${league.slug}/${sub}</loc>
    ${lastmod}
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
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
