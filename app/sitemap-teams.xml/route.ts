import { createClient } from "@/lib/supabase";

export const revalidate = 3600;

export async function GET() {
  const supabase = createClient();
  const baseUrl = "https://360-foot.com";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all: any[] = [];
  for (let offset = 0; offset < 10; offset++) {
    const { data, error } = await supabase
      .from("teams")
      .select("slug, created_at")
      .range(offset * 1000, (offset + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    all.push(...data);
    if (data.length < 1000) break;
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  for (const t of all) {
    xml += `
  <url>
    <loc>${baseUrl}/equipe/${t.slug}</loc>
    ${t.created_at ? `<lastmod>${new Date(t.created_at).toISOString()}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
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
