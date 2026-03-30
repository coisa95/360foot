import { createClient } from "@/lib/supabase";

export const revalidate = 3600;

export async function GET() {
  const supabase = createClient();

  const [
    { data: articles },
    { data: matches },
    { data: teams },
    { data: leagues },
    { data: players },
  ] = await Promise.all([
    supabase
      .from("articles")
      .select("slug, published_at")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false }),
    supabase
      .from("matches")
      .select("slug, date")
      .order("date", { ascending: false })
      .limit(500),
    supabase.from("teams").select("slug, updated_at"),
    supabase.from("leagues").select("slug, updated_at"),
    supabase.from("players").select("slug, updated_at"),
  ]);

  const baseUrl = "https://360-foot.com";

  const staticPages = [
    { url: "/", priority: "1.0", changefreq: "hourly" },
    { url: "/actu", priority: "0.9", changefreq: "hourly" },
    { url: "/resultats", priority: "0.9", changefreq: "hourly" },
    { url: "/competitions", priority: "0.8", changefreq: "daily" },
    { url: "/transferts", priority: "0.8", changefreq: "daily" },
    { url: "/bons-plans", priority: "0.7", changefreq: "weekly" },
    { url: "/methodologie", priority: "0.3", changefreq: "monthly" },
    { url: "/confidentialite", priority: "0.2", changefreq: "monthly" },
    { url: "/mentions-legales", priority: "0.2", changefreq: "monthly" },
  ];

  const nationalTeams = ["CI", "SN", "CM", "ML", "BF"];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Pages statiques
  for (const page of staticPages) {
    xml += `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  }

  // Articles
  if (articles) {
    for (const article of articles) {
      xml += `
  <url>
    <loc>${baseUrl}/actu/${article.slug}</loc>
    <lastmod>${new Date(article.published_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }
  }

  // Matchs
  if (matches) {
    for (const match of matches) {
      xml += `
  <url>
    <loc>${baseUrl}/match/${match.slug}</loc>
    <lastmod>${new Date(match.date).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
    }
  }

  // Equipes
  if (teams) {
    for (const team of teams) {
      xml += `
  <url>
    <loc>${baseUrl}/equipe/${team.slug}</loc>
    ${team.updated_at ? `<lastmod>${new Date(team.updated_at).toISOString()}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }
  }

  // Ligues
  if (leagues) {
    for (const league of leagues) {
      xml += `
  <url>
    <loc>${baseUrl}/ligue/${league.slug}</loc>
    ${league.updated_at ? `<lastmod>${new Date(league.updated_at).toISOString()}</lastmod>` : ""}
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;

    }
  }

  // Joueurs
  if (players) {
    for (const player of players) {
      xml += `
  <url>
    <loc>${baseUrl}/joueur/${player.slug}</loc>
    ${player.updated_at ? `<lastmod>${new Date(player.updated_at).toISOString()}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`;
    }
  }

  // Selections nationales
  for (const code of nationalTeams) {
    xml += `
  <url>
    <loc>${baseUrl}/selection/${code.toLowerCase()}</loc>
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
