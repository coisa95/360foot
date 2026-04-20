import { createAnonClient } from "@/lib/supabase";

export const revalidate = 3600;

export async function GET() {
  const supabase = createAnonClient();
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

  const subPages: { path: string; priority: number; changefreq: string }[] = [
    { path: "resultats", priority: 0.6, changefreq: "daily" },
    { path: "calendrier", priority: 0.5, changefreq: "weekly" },
    { path: "actualites", priority: 0.7, changefreq: "daily" },
    { path: "buteurs", priority: 0.5, changefreq: "weekly" },
    { path: "passeurs", priority: 0.5, changefreq: "weekly" },
  ];

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
    <loc>${baseUrl}/ligue/${league.slug}/${sub.path}</loc>
    ${lastmod}
    <changefreq>${sub.changefreq}</changefreq>
    <priority>${sub.priority}</priority>
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
