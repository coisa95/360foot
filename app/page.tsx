import { createClient } from "@/lib/supabase";
import { ArticleCard } from "@/components/article-card";
import { MatchCard } from "@/components/match-card";
import { StandingsTable } from "@/components/standings-table";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 300;

const TYPE_LABELS: Record<string, string> = {
  result: "Résultat",
  preview: "Avant-match",
  transfer: "Transfert",
  recap: "Récap",
  player_profile: "Joueur",
};

const TYPE_COLORS: Record<string, string> = {
  result: "bg-blue-500/20 text-blue-400",
  preview: "bg-orange-500/20 text-orange-400",
  transfer: "bg-purple-500/20 text-purple-400",
  recap: "bg-emerald-500/20 text-emerald-400",
  player_profile: "bg-cyan-500/20 text-cyan-400",
};

async function getLatestArticles() {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("articles")
      .select("slug, title, excerpt, type, published_at, league:leagues!league_id(name), og_image_url")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(12);
    return data || [];
  } catch {
    return [];
  }
}

async function getTodayMatches() {
  try {
    const supabase = createClient();
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("matches")
      .select(
        "slug, date, status, score_home, score_away, home_team:teams!home_team_id(name, logo_url), away_team:teams!away_team_id(name, logo_url), league:leagues(name)"
      )
      .gte("date", `${today}T00:00:00`)
      .lte("date", `${today}T23:59:59`)
      .order("date", { ascending: true })
      .limit(20);
    return data || [];
  } catch {
    return [];
  }
}

async function getStandings() {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("standings")
      .select("league_id, data_json, leagues(name, slug)")
      .order("updated_at", { ascending: false })
      .limit(3);
    return data || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [articles, matches, standings] = await Promise.all([
    getLatestArticles(),
    getTodayMatches(),
    getStandings(),
  ]);

  const featuredArticle = articles.length > 0 ? articles[0] : null;
  const secondaryArticles = articles.slice(1, 4);
  const remainingArticles = articles.slice(4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Hero */}
      <section className="mb-10 bg-glow-lime rounded-2xl p-6">
        <h1 className="text-3xl font-bold text-white md:text-4xl">
          Actu Football{" "}
          <span className="bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Afrique &amp; Europe
          </span>
        </h1>
        <p className="mt-3 text-gray-400 text-lg">
          Résultats, analyses, transferts — couverture 24/7 du football africain et européen.
        </p>
      </section>

      {/* SECTION 1: Articles en vedette */}
      {featuredArticle && (
        <section className="mb-8">
          {/* Article principal - grande carte */}
          <Link href={`/actu/${(featuredArticle as Record<string, unknown>).slug}`} className="group block mb-4">
            <Card className="overflow-hidden rounded-xl border border-dark-border/50 bg-dark-card/80 shadow-xl shadow-black/20 backdrop-blur-sm transition-all duration-300 hover:border-lime-500/20 hover:shadow-2xl hover:shadow-lime-500/5 hover:-translate-y-0.5">
              <div className="grid md:grid-cols-2">
                <div className="relative aspect-video md:aspect-auto md:min-h-[280px]">
                  <Image
                    src={(featuredArticle as Record<string, unknown>).og_image_url as string || `/api/og?title=${encodeURIComponent((featuredArticle as Record<string, unknown>).title as string)}&type=${(featuredArticle as Record<string, unknown>).type || "result"}`}
                    alt={(featuredArticle as Record<string, unknown>).title as string}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="flex flex-col justify-center p-6">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[(featuredArticle as Record<string, unknown>).type as string] || "bg-lime-500/10 text-lime-400"}`}>
                      {TYPE_LABELS[(featuredArticle as Record<string, unknown>).type as string] || "Actu"}
                    </span>
                    {(() => {
                      const league = (featuredArticle as Record<string, unknown>).league as Record<string, unknown> | null;
                      return league?.name ? (
                        <span className="text-xs text-gray-500">{league.name as string}</span>
                      ) : null;
                    })()}
                  </div>
                  <h2 className="mb-3 text-xl font-bold leading-tight text-white transition-colors group-hover:text-lime-400 md:text-2xl">
                    {(featuredArticle as Record<string, unknown>).title as string}
                  </h2>
                  {String((featuredArticle as Record<string, unknown>).excerpt || "") !== "" && (
                    <p className="mb-4 line-clamp-3 text-gray-400 text-sm">
                      {String((featuredArticle as Record<string, unknown>).excerpt)}
                    </p>
                  )}
                  <time className="text-xs text-gray-500" dateTime={(featuredArticle as Record<string, unknown>).published_at as string}>
                    {new Date((featuredArticle as Record<string, unknown>).published_at as string).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
              </div>
            </Card>
          </Link>

          {/* 3 articles secondaires */}
          {secondaryArticles.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {secondaryArticles.map((article: Record<string, unknown>) => {
                const league = article.league as Record<string, unknown> | null;
                return (
                  <Link key={article.slug as string} href={`/actu/${article.slug}`} className="group">
                    <Card className="h-full overflow-hidden border-dark-border bg-dark-card transition-all hover:border-lime-500/30 hover:bg-dark-surface">
                      <div className="relative aspect-video">
                        <Image
                          src={article.og_image_url as string || `/api/og?title=${encodeURIComponent(article.title as string)}&type=${article.type || "result"}`}
                          alt={article.title as string}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 33vw"
                        />
                        <div className="absolute left-2 top-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_COLORS[article.type as string] || "bg-lime-500/10 text-lime-400"}`}>
                            {TYPE_LABELS[article.type as string] || "Actu"}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        {String(league?.name || "") !== "" && (
                          <span className="text-xs text-gray-500">{String(league?.name)}</span>
                        )}
                        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-tight text-white transition-colors group-hover:text-lime-400">
                          {article.title as string}
                        </h3>
                        <time className="mt-2 block text-[10px] text-gray-500" dateTime={article.published_at as string}>
                          {new Date(article.published_at as string).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                          })}
                        </time>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Bouton voir toutes les actus */}
          <div className="mt-4 text-center">
            <Link
              href="/actu"
              className="inline-block rounded-xl bg-gradient-to-r from-lime-500/10 to-emerald-500/10 border border-lime-500/20 px-6 py-2.5 text-sm font-semibold text-lime-400 shadow-lg shadow-lime-500/5 transition-all duration-300 hover:from-lime-500/20 hover:to-emerald-500/20 hover:shadow-xl hover:shadow-lime-500/10 hover:-translate-y-0.5"
            >
              Voir toutes les actualités →
            </Link>
          </div>
        </section>
      )}

      <Separator className="my-6 bg-dark-border" />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* SECTION 2: Matchs du jour */}
          {matches.length > 0 && (
            <section className="mb-8">
              <h2 className="section-title mb-4">
                Matchs du jour
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {matches.map((match: Record<string, unknown>) => {
                  const homeTeam = match.home_team as Record<string, unknown> | null;
                  const awayTeam = match.away_team as Record<string, unknown> | null;
                  const league = match.league as Record<string, unknown> | null;
                  return (
                    <MatchCard
                      key={match.slug as string}
                      slug={match.slug as string}
                      homeTeam={(homeTeam?.name as string) || ""}
                      awayTeam={(awayTeam?.name as string) || ""}
                      homeScore={match.score_home as number | null}
                      awayScore={match.score_away as number | null}
                      status={match.status as string}
                      date={match.date as string}
                      leagueName={(league?.name as string) || ""}
                    />
                  );
                })}
              </div>
            </section>
          )}

          <Separator className="my-6 bg-dark-border" />

          {/* SECTION 3: Plus d'articles */}
          {remainingArticles.length > 0 && (
            <section>
              <h2 className="section-title mb-4">
                Plus d&apos;actualités
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {remainingArticles.map((article: Record<string, unknown>) => {
                  const league = article.league as Record<string, unknown> | null;
                  return (
                    <ArticleCard
                      key={article.slug as string}
                      slug={article.slug as string}
                      title={article.title as string}
                      excerpt={(article.excerpt as string) || ""}
                      type={article.type as string}
                      publishedAt={article.published_at as string}
                      leagueName={league?.name as string | undefined}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Partenaires */}
          <AffiliateTrio />

          {/* Classements */}
          {standings.length > 0
            ? standings.map((standing: Record<string, unknown>) => {
                const leagues = standing.leagues as Record<string, unknown> | null;
                const dataJson = standing.data_json as Array<Record<string, unknown>> | null;
                if (!dataJson || !leagues) return null;
                return (
                  <StandingsTable
                    key={standing.league_id as string}
                    leagueName={(leagues.name as string) || ""}
                    leagueSlug={(leagues.slug as string) || ""}
                    standings={dataJson.map((row) => ({
                      rank: (row.rank as number) || 0,
                      teamName: (row.team_name as string) || "",
                      teamSlug: (row.team_slug as string) || "",
                      played: (row.played as number) || 0,
                      won: (row.won as number) || 0,
                      drawn: (row.drawn as number) || 0,
                      lost: (row.lost as number) || 0,
                      goalsFor: (row.goals_for as number) || 0,
                      goalsAgainst: (row.goals_against as number) || 0,
                      goalDiff: (row.goal_diff as number) || 0,
                      points: (row.points as number) || 0,
                    }))}
                    compact
                  />
                );
              })
            : (
              <div className="rounded-lg border border-dark-border bg-dark-card p-6 text-center">
                <p className="text-sm text-gray-500">
                  Classements en cours de chargement...
                </p>
              </div>
            )}
        </aside>
      </div>
    </div>
  );
}
