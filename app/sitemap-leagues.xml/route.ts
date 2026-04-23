import { createAnonClient } from "@/lib/supabase";
import { MIN_ARTICLES_FOR_INDEX } from "@/lib/seo-helpers";

export const revalidate = 3600;

export async function GET() {
  const supabase = createAnonClient();
  const baseUrl = "https://360-foot.com";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all: any[] = [];
  for (let offset = 0; offset < 5; offset++) {
    const { data, error } = await supabase
      .from("leagues")
      .select("id, slug, created_at")
      .not("slug", "is", null)
      .range(offset * 1000, (offset + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    all.push(...data);
    if (data.length < 1000) break;
  }

  // Pour chaque ligue on vérifie en parallèle les signaux qui déterminent
  // l'indexabilité de chaque sous-page. On n'inclut dans le sitemap que
  // les URLs qui ne seront PAS marquées noindex — sinon on envoie à Google
  // un signal incohérent (sitemap dit "indexe", la page dit "non").
  const nowIso = new Date().toISOString();
  const resultsCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  type Signals = {
    hasStandings: boolean;
    hasAnyMatch: boolean;
    hasRecentResults: boolean;
    hasUpcoming: boolean;
    hasScorers: boolean;
    hasAssists: boolean;
    hasArticles: boolean;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function signalsFor(league: any): Promise<Signals> {
    const [standings, recentResults, upcoming, articles] = await Promise.all([
      supabase
        .from("standings")
        .select("data_json, top_scorers_json, top_assists_json")
        .eq("league_id", league.id)
        .order("updated_at", { ascending: false })
        .limit(1),
      supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .eq("league_id", league.id)
        .not("score_home", "is", null)
        .gte("date", resultsCutoff),
      supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .eq("league_id", league.id)
        .gte("date", nowIso),
      supabase
        .from("articles")
        .select("id", { count: "exact", head: true })
        .eq("league_id", league.id)
        .not("published_at", "is", null),
    ]);
    const st = standings.data?.[0];
    const hasStandings = Array.isArray(st?.data_json) && (st!.data_json as unknown[]).length > 0;
    const hasScorers = Array.isArray(st?.top_scorers_json) && (st!.top_scorers_json as unknown[]).length > 0;
    const hasAssists = Array.isArray(st?.top_assists_json) && (st!.top_assists_json as unknown[]).length > 0;
    return {
      hasStandings,
      hasAnyMatch: (recentResults.count ?? 0) > 0 || (upcoming.count ?? 0) > 0,
      hasRecentResults: (recentResults.count ?? 0) > 0,
      hasUpcoming: (upcoming.count ?? 0) > 0,
      hasScorers,
      hasAssists,
      hasArticles: (articles.count ?? 0) >= MIN_ARTICLES_FOR_INDEX,
    };
  }

  const entries = await Promise.all(
    all.map(async (league) => ({ league, signals: await signalsFor(league) }))
  );

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  for (const { league, signals } of entries) {
    // Ligue racine : indexable si standings OU matchs.
    if (!signals.hasStandings && !signals.hasAnyMatch) continue;

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

    const subs: { path: string; priority: number; changefreq: string; include: boolean }[] = [
      { path: "resultats", priority: 0.6, changefreq: "daily", include: signals.hasRecentResults },
      { path: "calendrier", priority: 0.5, changefreq: "weekly", include: signals.hasUpcoming },
      { path: "actualites", priority: 0.7, changefreq: "daily", include: signals.hasArticles },
      { path: "buteurs", priority: 0.5, changefreq: "weekly", include: signals.hasScorers },
      { path: "passeurs", priority: 0.5, changefreq: "weekly", include: signals.hasAssists },
    ];
    for (const sub of subs) {
      if (!sub.include) continue;
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
