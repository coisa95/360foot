import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { verifyCronAuth } from "@/lib/auth";

export const maxDuration = 300;

const BASE_URL = "https://360-foot.com";

export async function GET(request: Request) {
  try {
    if (!verifyCronAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();

    // Fetch all published articles
    const { data: articles } = await supabase
      .from("articles")
      .select("slug, published_at, type")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false });

    // Fetch all teams
    const { data: teams } = await supabase
      .from("teams")
      .select("slug, updated_at");

    // Fetch all leagues
    const { data: leagues } = await supabase
      .from("leagues")
      .select("slug, updated_at");

    // Fetch all players
    const { data: players } = await supabase
      .from("players")
      .select("slug, updated_at");

    // Fetch matches
    const { data: matches } = await supabase
      .from("matches")
      .select("slug, date")
      .order("date", { ascending: false })
      .limit(2000);

    // Fetch active bookmakers
    const { data: bookmakers } = await supabase
      .from("bookmakers")
      .select("slug")
      .eq("active", true);

    // Build sitemap XML
    const urls: Array<{ loc: string; lastmod: string; priority: string; changefreq: string }> = [];

    // Static pages
    const now = new Date().toISOString();
    urls.push(
      { loc: BASE_URL, lastmod: now, priority: "1.0", changefreq: "hourly" },
      { loc: `${BASE_URL}/actu`, lastmod: now, priority: "0.9", changefreq: "hourly" },
      { loc: `${BASE_URL}/matchs`, lastmod: now, priority: "0.9", changefreq: "hourly" },
      { loc: `${BASE_URL}/competitions`, lastmod: now, priority: "0.8", changefreq: "daily" },
      { loc: `${BASE_URL}/transferts`, lastmod: now, priority: "0.7", changefreq: "daily" },
      { loc: `${BASE_URL}/bons-plans`, lastmod: now, priority: "0.6", changefreq: "weekly" },
      { loc: `${BASE_URL}/bookmakers`, lastmod: now, priority: "0.7", changefreq: "weekly" },
      { loc: `${BASE_URL}/selection`, lastmod: now, priority: "0.7", changefreq: "weekly" },
      { loc: `${BASE_URL}/methodologie`, lastmod: now, priority: "0.3", changefreq: "monthly" },
      { loc: `${BASE_URL}/confidentialite`, lastmod: now, priority: "0.2", changefreq: "monthly" },
      { loc: `${BASE_URL}/mentions-legales`, lastmod: now, priority: "0.2", changefreq: "monthly" },
    );

    // Articles — all under /actu/
    for (const article of articles || []) {
      urls.push({
        loc: `${BASE_URL}/actu/${article.slug}`,
        lastmod: article.published_at,
        priority: "0.8",
        changefreq: "weekly",
      });
    }

    // Teams
    for (const team of teams || []) {
      urls.push({
        loc: `${BASE_URL}/equipe/${team.slug}`,
        lastmod: team.updated_at || new Date().toISOString(),
        priority: "0.6",
        changefreq: "weekly",
      });
    }

    // Matches
    for (const match of matches || []) {
      urls.push({
        loc: `${BASE_URL}/match/${match.slug}`,
        lastmod: new Date(match.date).toISOString(),
        priority: "0.7",
        changefreq: "daily",
      });
    }

    // Leagues + sub-pages
    const leagueSubPages = ["resultats", "calendrier", "actualites", "buteurs", "passeurs"];
    for (const league of leagues || []) {
      const lastmod = league.updated_at || new Date().toISOString();
      urls.push({
        loc: `${BASE_URL}/ligue/${league.slug}`,
        lastmod,
        priority: "0.8",
        changefreq: "daily",
      });
      for (const sub of leagueSubPages) {
        urls.push({
          loc: `${BASE_URL}/ligue/${league.slug}/${sub}`,
          lastmod,
          priority: "0.7",
          changefreq: "daily",
        });
      }
    }

    // Bookmakers + go pages
    for (const bk of bookmakers || []) {
      urls.push(
        {
          loc: `${BASE_URL}/bookmakers/${bk.slug}`,
          lastmod: now,
          priority: "0.6",
          changefreq: "weekly",
        },
        {
          loc: `${BASE_URL}/go/${bk.slug}`,
          lastmod: now,
          priority: "0.7",
          changefreq: "weekly",
        }
      );
    }

    // Selections nationales
    const nationalTeams = ["ci", "sn", "cm", "ml", "bf"];
    for (const code of nationalTeams) {
      urls.push({
        loc: `${BASE_URL}/selection/${code}`,
        lastmod: now,
        priority: "0.6",
        changefreq: "weekly",
      });
    }

    // Players
    for (const player of players || []) {
      urls.push({
        loc: `${BASE_URL}/joueur/${player.slug}`,
        lastmod: player.updated_at || new Date().toISOString(),
        priority: "0.5",
        changefreq: "weekly",
      });
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Error in generate-sitemap cron:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
