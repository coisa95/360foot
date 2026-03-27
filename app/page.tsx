import { createClient } from "@/lib/supabase";
import { ArticleCard } from "@/components/article-card";
import { ArticleCarousel } from "@/components/article-carousel";
import { MatchCard } from "@/components/match-card";
import { StandingsTable } from "@/components/standings-table";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export const revalidate = 300;

export const metadata = {
  title: "360 Foot — Actu Football Afrique & Europe en Direct",
  description: "Résultats, classements, transferts et analyses football. Ligue 1 Côte d'Ivoire, Sénégal, Cameroun, Premier League, Champions League. Toute l'actu foot en direct.",
  alternates: {
    canonical: "https://360-foot.com",
  },
  openGraph: {
    title: "360 Foot — Actu Football Afrique & Europe en Direct",
    description: "Résultats, classements, transferts et analyses football. Toute l'actu foot en direct.",
    type: "website" as const,
    url: "https://360-foot.com",
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "360 Foot — Actu Football Afrique & Europe en Direct",
    description: "Résultats, classements, transferts et analyses football. Toute l'actu foot en direct.",
  },
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

// Compétitions terminées — à ne pas afficher en page d'accueil
const FINISHED_COMPETITION_SLUGS = ["can"];

// Ligues prioritaires pour la sidebar (ligues africaines + top européennes)
const PRIORITY_LEAGUE_SLUGS = [
  "ligue-1-cote-divoire",
  "ligue-pro-senegal",
  "elite-one-cameroun",
  "ligue-1-france",
  "premier-league",
  "la-liga",
];

async function getStandings() {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("standings")
      .select("league_id, data_json, leagues(name, slug)")
      .order("updated_at", { ascending: false });

    if (!data) return [];

    // Exclure les compétitions terminées
    const active = data.filter((s: Record<string, unknown>) => {
      const leagues = s.leagues as Record<string, unknown> | null;
      const slug = (leagues?.slug as string) || "";
      return !FINISHED_COMPETITION_SLUGS.includes(slug);
    });

    // Trier par priorité : ligues prioritaires d'abord
    active.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      const slugA = ((a.leagues as Record<string, unknown>)?.slug as string) || "";
      const slugB = ((b.leagues as Record<string, unknown>)?.slug as string) || "";
      const idxA = PRIORITY_LEAGUE_SLUGS.indexOf(slugA);
      const idxB = PRIORITY_LEAGUE_SLUGS.indexOf(slugB);
      const prioA = idxA >= 0 ? idxA : 999;
      const prioB = idxB >= 0 ? idxB : 999;
      return prioA - prioB;
    });

    return active.slice(0, 3);
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

  const remainingArticles = articles.slice(6);

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 md:py-8">
      {/* Hero — minimal on mobile */}
      <section className="mb-2 md:mb-10 hidden md:block bg-glow-lime rounded-2xl p-6">
        <h1 className="text-4xl font-bold text-white">
          Actu Football{" "}
          <span className="bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Afrique &amp; Europe
          </span>
        </h1>
        <p className="mt-3 text-gray-400 text-lg">
          Résultats, analyses, transferts — couverture 24/7 du football africain et européen.
        </p>
      </section>

      {/* SECTION 1: Articles en vedette — Carousel */}
      {articles.length > 0 && (
        <section className="mb-4 md:mb-8">
          <ArticleCarousel
            articles={articles.slice(0, 6).map((a: Record<string, unknown>) => ({
              slug: a.slug as string,
              title: a.title as string,
              excerpt: (a.excerpt as string) || "",
              type: (a.type as string) || "result",
              published_at: a.published_at as string,
              og_image_url: a.og_image_url as string | null,
              league: a.league as { name: string } | null,
            }))}
          />

          {/* Bouton voir toutes les actus */}
          <div className="mt-3 md:mt-6 text-center">
            <Link
              href="/actu"
              className="inline-block rounded-xl bg-gradient-to-r from-lime-500/10 to-emerald-500/10 border border-lime-500/20 px-6 py-2.5 text-sm font-semibold text-lime-400 shadow-lg shadow-lime-500/5 transition-all duration-300 hover:from-lime-500/20 hover:to-emerald-500/20 hover:shadow-xl hover:shadow-lime-500/10 hover:-translate-y-0.5"
            >
              Voir toutes les actualités →
            </Link>
          </div>
        </section>
      )}

      {/* SECTION 2: Matchs du jour — full width */}
      {matches.length > 0 && (
        <section className="mb-4 md:mb-8">
          <h2 className="section-title mb-3 md:mb-4">
            Matchs du jour
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

      <Separator className="my-3 md:my-6 bg-dark-border" />

      {/* Partenaires */}
      <AffiliateTrio />

      <Separator className="my-3 md:my-6 bg-dark-border" />

      <div className="grid gap-4 md:gap-8 lg:grid-cols-3">
        {/* Plus d'articles */}
        <div className="lg:col-span-2">
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

        {/* Sidebar — Classements */}
        <aside className="space-y-6">
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
