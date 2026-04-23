import { createAnonClient } from "@/lib/supabase";

export const revalidate = 3600;

export async function GET() {
  const supabase = createAnonClient();
  const baseUrl = "https://360-foot.com";

  // Exclut les équipes sans slug ou sans aucun signal de contenu.
  // On inclut les équipes qui ont soit team_stats_json, soit un league_id
  // (auquel cas au moins le classement les rattache à un contexte). Les
  // équipes orphelines sans contenu sont filtrées côté noindex de toute
  // façon — autant ne pas les lister dans le sitemap.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all: any[] = [];
  for (let offset = 0; offset < 10; offset++) {
    const { data, error } = await supabase
      .from("teams")
      .select("slug, created_at, team_stats_json, league_id")
      .not("slug", "is", null)
      .range(offset * 1000, (offset + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    all.push(...data);
    if (data.length < 1000) break;
  }

  const filtered = all.filter((t) => {
    const hasStats = t.team_stats_json && Object.keys(t.team_stats_json).length > 0;
    return hasStats || !!t.league_id;
  });

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  for (const t of filtered) {
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
