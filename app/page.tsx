import { createClient } from "@/lib/supabase";
import { ArticleCard } from "@/components/article-card";
import { MatchCard } from "@/components/match-card";
import { StandingsTable } from "@/components/standings-table";
import { AffiliateBanner } from "@/components/affiliate-banner";
import { Separator } from "@/components/ui/separator";

export const revalidate = 300;

async function getLatestArticles() {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("articles")
      .select("slug, title, excerpt, type, published_at, leagues(name)")
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
        "slug, date, status, score_home, score_away, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name), league:leagues(name)"
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Hero */}
      <section className="mb-8">
        <h1 className="text-3xl font-bold text-white md:text-4xl">
          Actu Football{" "}
          <span className="bg-gradient-to-r from-lime-400 to-lime-300 bg-clip-text text-transparent">
            en Direct
          </span>
        </h1>
        <p className="mt-2 text-gray-400">
          Résultats, classements, transferts — Afrique &amp; Europe, 24/7.
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Today's Matches */}
          {matches.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-4 text-lg font-bold text-white">
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
                      homeTeam={(homeTeam?.name as string) || "Équipe A"}
                      awayTeam={(awayTeam?.name as string) || "Équipe B"}
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

          {/* Latest Articles */}
          <section>
            <h2 className="mb-4 text-lg font-bold text-white">
              Dernières actus
            </h2>
            {articles.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {articles.map((article: Record<string, unknown>) => {
                  const leagues = article.leagues as Record<string, unknown> | null;
                  return (
                    <ArticleCard
                      key={article.slug as string}
                      slug={article.slug as string}
                      title={article.title as string}
                      excerpt={(article.excerpt as string) || ""}
                      type={article.type as string}
                      publishedAt={article.published_at as string}
                      leagueName={leagues?.name as string | undefined}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dark-border bg-dark-card p-8 text-center">
                <p className="text-gray-400">
                  Les articles arrivent bientôt. Le pipeline IA est en cours de configuration.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <AffiliateBanner
            bookmakerName="1xBet"
            affiliateUrl="https://reffpa.com/L?tag=d_689933m_1573c_bonus&site=689933&ad=1573"
            bonus="Bonus de bienvenue jusqu'à 200 000 FCFA"
          />

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
