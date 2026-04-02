import { createClient } from "@/lib/supabase";
import { ArticleCarousel } from "@/components/article-carousel";
import { MatchCard } from "@/components/match-card";
import Link from "next/link";
import dynamic from "next/dynamic";

const ArticleCard = dynamic(() => import("@/components/article-card").then((m) => m.ArticleCard));
const StandingsTable = dynamic(() => import("@/components/standings-table").then((m) => m.StandingsTable));
const AffiliateTrio = dynamic(() => import("@/components/affiliate-trio").then((m) => m.AffiliateTrio));

export const revalidate = 600;

export const metadata = {
  title: "360 Foot — Actu Football Afrique & Europe en Direct",
  description: "Résultats, classements, transferts et analyses football. Ligue 1 Côte d'Ivoire, Sénégal, Cameroun, Premier League, Champions League.",
  alternates: {
    canonical: "https://360-foot.com",
  },
  openGraph: {
    title: "360 Foot — Actu Football Afrique & Europe en Direct",
    description: "Résultats, classements, transferts et analyses football. Toute l'actu foot en direct.",
    type: "website" as const,
    url: "https://360-foot.com",
    locale: "fr_FR",
    images: ["https://360-foot.com/og-home.png"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "360 Foot — Actu Football Afrique & Europe en Direct",
    description: "Résultats, classements, transferts et analyses football. Toute l'actu foot en direct.",
    images: ["https://360-foot.com/og-home.png"],
  },
};

async function getLatestArticles() {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("articles")
      .select("slug, title, excerpt, type, published_at, league:leagues!league_id(name), og_image_url")
      .not("published_at", "is", null)
      .neq("type", "preview")
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
      .order("updated_at", { ascending: false })
      .limit(30);

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

function SectionHeader({ title, href, linkText, accent = "lime" }: { title: string; href?: string; linkText?: string; accent?: "lime" | "blue" | "purple" | "orange" }) {
  const accents = {
    lime: { bar: "from-lime-400 to-emerald-500", text: "text-lime-400", hover: "hover:text-lime-300" },
    blue: { bar: "from-blue-400 to-cyan-500", text: "text-blue-400", hover: "hover:text-blue-300" },
    purple: { bar: "from-purple-400 to-pink-500", text: "text-purple-400", hover: "hover:text-purple-300" },
    orange: { bar: "from-orange-400 to-amber-500", text: "text-orange-400", hover: "hover:text-orange-300" },
  };
  const a = accents[accent];
  return (
    <div className="flex items-center justify-between mb-4 md:mb-6">
      <div className="flex items-center gap-3">
        <div className={`w-1 h-6 rounded-full bg-gradient-to-b ${a.bar}`} />
        <h2 className="text-lg md:text-xl font-bold text-white">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className={`text-xs md:text-sm ${a.text} ${a.hover} transition-colors font-medium`}
        >
          {linkText || "Voir tout"} →
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const [articles, matches, standings] = await Promise.all([
    getLatestArticles(),
    getTodayMatches(),
    getStandings(),
  ]);

  const remainingArticles = articles.slice(6);

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 md:py-8 space-y-6 md:space-y-10">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-[#0d1117] via-[#111827] to-[#0d1117] border border-lime-500/20 p-5 md:p-10">
        {/* Colored glow effects */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-lime-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-10 left-1/2 w-40 h-40 bg-cyan-500/8 rounded-full blur-3xl" />
        <div className="relative">
          <h1 className="text-xl sm:text-3xl md:text-5xl font-extrabold text-white leading-tight whitespace-nowrap">
            Football{" "}
            <span className="bg-gradient-to-r from-lime-300 via-emerald-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(163,230,53,0.3)]">
              Afrique &amp; Europe
            </span>
          </h1>
          <p className="mt-2 md:mt-4 text-xs md:text-lg text-gray-400 max-w-2xl">
            Résultats, analyses et transferts — couverture 24/7.
          </p>
          <div className="mt-3 md:mt-6 flex gap-2 md:gap-3">
            <Link href="/matchs" className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-lime-500/20 to-emerald-500/20 border border-lime-500/30 px-3.5 py-1.5 md:px-5 md:py-2 text-xs md:text-sm font-semibold text-lime-300 hover:from-lime-500/30 hover:to-emerald-500/30 hover:shadow-lg hover:shadow-lime-500/10 transition-all">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-lime-400" /></span>
              Matchs en direct
            </Link>
            <Link href="/actu" className="inline-flex items-center rounded-full bg-blue-500/10 border border-blue-500/20 px-3.5 py-1.5 md:px-5 md:py-2 text-xs md:text-sm font-medium text-blue-300 hover:bg-blue-500/20 transition-all">
              Actualités
            </Link>
          </div>
        </div>
      </section>

      {/* ── CAROUSEL ARTICLES EN VEDETTE ── */}
      {articles.length > 0 && (
        <section>
          <SectionHeader title="A la une" href="/actu" linkText="Toutes les actus" accent="orange" />
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
        </section>
      )}

      {/* ── MATCHS DU JOUR ── */}
      {matches.length > 0 && (
        <section>
          <SectionHeader title="Matchs du jour" href="/matchs" linkText="Tous les matchs" accent="blue" />
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
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
                  homeLogoUrl={(homeTeam?.logo_url as string) || null}
                  awayLogoUrl={(awayTeam?.logo_url as string) || null}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* ── PARTENAIRES ── */}
      <AffiliateTrio />

      {/* ── ARTICLES + CLASSEMENTS ── */}
      <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
        {/* Plus d'articles */}
        <div className="lg:col-span-2">
          {remainingArticles.length > 0 && (
            <section>
              <SectionHeader title="Plus d'actualités" href="/actu" accent="purple" />
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
                      imageUrl={(article.og_image_url as string) || null}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar — Classements */}
        <aside className="space-y-4">
          <SectionHeader title="Classements" href="/competitions" accent="lime" />
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
                      teamLogo: (row.team_logo as string) || "",
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
