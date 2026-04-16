/**
 * GET /api/admin/scrape-health
 *
 * Endpoint d'observabilité : retourne l'état de santé des crons sur les 24
 * dernières heures. Protégé par CRON_SECRET (même auth que les crons).
 *
 * Réponse :
 *   - runs récents par cron_name
 *   - total articles générés
 *   - sources avec 0 output (potentiellement mortes)
 *   - score de santé global (0-100)
 */
import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase";

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: runs } = await supabase
    .from("cron_runs")
    .select("*")
    .gte("started_at", since)
    .order("started_at", { ascending: false })
    .limit(100);

  if (!runs || runs.length === 0) {
    return NextResponse.json({
      status: "no_data",
      message: "Aucun run cron dans les dernières 24h",
      health_score: 0,
    });
  }

  // Agrégation par cron_name
  const byCron: Record<
    string,
    {
      runs: number;
      total_articles: number;
      total_errors: number;
      avg_duration_ms: number;
      last_run: string;
    }
  > = {};

  for (const run of runs) {
    const name = run.cron_name as string;
    if (!byCron[name]) {
      byCron[name] = {
        runs: 0,
        total_articles: 0,
        total_errors: 0,
        avg_duration_ms: 0,
        last_run: run.started_at as string,
      };
    }
    const c = byCron[name];
    c.runs++;
    c.total_articles += (run.articles_generated as number) || 0;
    c.total_errors += ((run.errors as string[]) || []).length;
    c.avg_duration_ms += (run.duration_ms as number) || 0;
  }

  for (const name of Object.keys(byCron)) {
    byCron[name].avg_duration_ms = Math.round(
      byCron[name].avg_duration_ms / byCron[name].runs
    );
  }

  // Sources mortes (scrape-african-local) : extraire des stats
  const africanRuns = runs.filter(
    (r) => (r.cron_name as string) === "scrape-african-local"
  );
  const deadSources: string[] = [];
  if (africanRuns.length > 0) {
    // Compter combien de fois chaque source a produit 0
    const sourceStats: Record<string, { total: number; zero: number }> = {};
    for (const run of africanRuns) {
      const stats = (run.stats as Array<Record<string, unknown>>) || [];
      for (const s of stats) {
        const name = s.source as string;
        if (!sourceStats[name]) sourceStats[name] = { total: 0, zero: 0 };
        sourceStats[name].total++;
        if ((s.generated as number) === 0 && (s.fetched as number) === 0) {
          sourceStats[name].zero++;
        }
      }
    }
    for (const [name, st] of Object.entries(sourceStats)) {
      if (st.zero === st.total && st.total >= 3) {
        deadSources.push(name);
      }
    }
  }

  // Score santé simplifié
  const totalArticles = Object.values(byCron).reduce(
    (sum, c) => sum + c.total_articles,
    0
  );
  const totalErrors = Object.values(byCron).reduce(
    (sum, c) => sum + c.total_errors,
    0
  );
  const totalRuns = Object.values(byCron).reduce(
    (sum, c) => sum + c.runs,
    0
  );
  const healthScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        100 -
          (deadSources.length * 10) -
          (totalErrors / Math.max(totalRuns, 1)) * 20
      )
    )
  );

  return NextResponse.json({
    status: healthScore >= 70 ? "healthy" : healthScore >= 40 ? "degraded" : "critical",
    health_score: healthScore,
    period: "last_24h",
    crons: byCron,
    total_articles_24h: totalArticles,
    dead_sources: deadSources.length > 0 ? deadSources : undefined,
  });
}
