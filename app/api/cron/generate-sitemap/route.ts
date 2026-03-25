import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://360foot.com";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();

    // Fetch all published articles
    const { data: articles } = await supabase
      .from("articles")
      .select("slug, published_at, updated_at, type")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    // Fetch all teams
    const { data: teams } = await supabase
      .from("teams")
      .select("slug, updated_at");

    // Fetch all leagues
    const { data: leagues } = await supabase
      .from("leagues")
      .select("slug, updated_at");

    // Fetch all players (if table exists)
    const { data: players } = await supabase
      .from("players")
      .select("slug, updated_at");

    // Build sitemap XML
    const urls: Array<{ loc: string; lastmod: string; priority: string; changefreq: string }> = [];

    // Static pages
    urls.push(
      { loc: BASE_URL, lastmod: new Date().toISOString(), priority: "1.0", changefreq: "hourly" },
      { loc: `${BASE_URL}/resultats`, lastmod: new Date().toISOString(), priority: "0.9", changefreq: "hourly" },
      { loc: `${BASE_URL}/classements`, lastmod: new Date().toISOString(), priority: "0.8", changefreq: "daily" },
      { loc: `${BASE_URL}/transferts`, lastmod: new Date().toISOString(), priority: "0.7", changefreq: "daily" },
    );

    // Articles
    for (const article of articles || []) {
      const prefix = article.type === "preview" ? "avant-match" : article.type === "transfer" ? "transferts" : "resultats";
      urls.push({
        loc: `${BASE_URL}/${prefix}/${article.slug}`,
        lastmod: article.updated_at || article.published_at,
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

    // Leagues
    for (const league of leagues || []) {
      urls.push({
        loc: `${BASE_URL}/ligue/${league.slug}`,
        lastmod: league.updated_at || new Date().toISOString(),
        priority: "0.7",
        changefreq: "daily",
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
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
