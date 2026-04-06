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
    { data: bookmakers },
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
      .limit(2000),
    supabase.from("teams").select("slug, created_at"),
    supabase.from("leagues").select("slug, created_at"),
    supabase.from("players").select("slug, created_at"),
    supabase.from("bookmakers").select("slug").eq("active", true),
  ]);

  const baseUrl = "https://360-foot.com";

  const staticPages = [
    { url: "/", priority: "1.0", changefreq: "hourly" },
    { url: "/actu", priority: "0.9", changefreq: "hourly" },
    { url: "/matchs", priority: "0.9", changefreq: "hourly" },
    { url: "/competitions", priority: "0.8", changefreq: "daily" },
    { url: "/transferts", priority: "0.8", changefreq: "daily" },
    { url: "/bons-plans", priority: "0.7", changefreq: "weekly" },
    { url: "/methodologie", priority: "0.3", changefreq: "monthly" },
    { url: "/confidentialite", priority: "0.2", changefreq: "monthly" },
    { url: "/mentions-legales", priority: "0.2", changefreq: "monthly" },
    { url: "/bookmakers", priority: "0.7", changefreq: "weekly" },
    { url: "/selection", priority: "0.7", changefreq: "weekly" },
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
    ${team.created_at ? `<lastmod>${new Date(team.created_at).toISOString()}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }
  }

  // Ligues + sous-pages
  if (leagues) {
    const leagueSubPages = ["resultats", "calendrier", "actualites", "buteurs", "passeurs"];
    for (const league of leagues) {
      const lastmod = league.created_at ? `<lastmod>${new Date(league.created_at).toISOString()}</lastmod>` : "";
      xml += `
  <url>
    <loc>${baseUrl}/ligue/${league.slug}</loc>
    ${lastmod}
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
      for (const sub of leagueSubPages) {
        xml += `
  <url>
    <loc>${baseUrl}/ligue/${league.slug}/${sub}</loc>
    ${lastmod}
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
      }
    }
  }

  // Joueurs
  if (players) {
    for (const player of players) {
      xml += `
  <url>
    <loc>${baseUrl}/joueur/${player.slug}</loc>
    ${player.created_at ? `<lastmod>${new Date(player.created_at).toISOString()}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`;
    }
  }

  // Bookmakers + go pages
  if (bookmakers) {
    for (const bk of bookmakers) {
      xml += `
  <url>
    <loc>${baseUrl}/bookmakers/${bk.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/go/${bk.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
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
