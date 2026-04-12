import { createClient } from "@/lib/supabase";

export const revalidate = 86400; // Once a day

export async function GET() {
  const supabase = createClient();
  const baseUrl = "https://360-foot.com";

  // Get all unique team pairs that have played against each other
  // We query finished matches and build unique pairs
  const { data: matches } = await supabase
    .from("matches")
    .select("home_team:teams!home_team_id(slug), away_team:teams!away_team_id(slug)")
    .not("score_home", "is", null)
    .order("date", { ascending: false })
    .limit(5000);

  const seen = new Set<string>();
  const pairs: { slugA: string; slugB: string }[] = [];

  for (const m of matches || []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const home = (m as any).home_team?.slug;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const away = (m as any).away_team?.slug;
    if (!home || !away) continue;

    // Canonical order: alphabetical
    const [a, b] = [home, away].sort();
    const key = `${a}-vs-${b}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push({ slugA: a, slugB: b });
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  for (const { slugA, slugB } of pairs) {
    xml += `
  <url>
    <loc>${baseUrl}/confrontation/${slugA}-vs-${slugB}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`;
  }

  xml += `
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
