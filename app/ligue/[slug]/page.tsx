import { createClient } from "@/lib/supabase";
import { Breadcrumb } from "@/components/breadcrumb";
import { StandingsTable } from "@/components/standings-table";
import { MatchCard } from "@/components/match-card";
import { ArticleCard } from "@/components/article-card";
import { AffiliateBanner } from "@/components/affiliate-banner";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createClient();

  const { data: league } = await supabase
    .from("leagues")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!league) return { title: "Ligue introuvable - 360 Foot" };

  const title = `Classement ${league.name} - Resultats et actualites - 360 Foot`;
  const description = `Classement complet de la ${league.name}, derniers resultats, calendrier des matchs et toute l'actualite de la ligue.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://360-foot.com/ligue/${slug}`,
    },
  };
}

export default async function LeaguePage({ params }: Props) {
  const { slug } = await params;
  const supabase = createClient();

  const { data: league } = await supabase
    .from("leagues")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!league) notFound();

  const { data: standingsData } = await supabase
    .from("standings")
    .select("data_json")
    .eq("league_id", league.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  const standings = ((standingsData?.data_json as Array<Record<string, unknown>>) || []).map((row) => ({
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
  }));

  const { data: recentMatches } = await supabase
    .from("matches")
    .select("*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), league:leagues!league_id(*)")
    .eq("league_id", league.id)
    .eq("status", "FT")
    .order("date", { ascending: false })
    .limit(10);

  const { data: articles } = await supabase
    .from("articles")
    .select("*")
    .eq("league_id", league.id)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(6);

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: league.name },
  ];

  return (
    <main className="min-h-screen bg-dark-bg text-white">
      <div className="container mx-auto px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-lime-400">{league.name}</h1>
          {league.country && (
            <p className="text-gray-400 mt-1">{league.country}</p>
          )}
        </div>

        {/* Classement */}
        {standings && standings.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Classement</h2>
            <StandingsTable leagueName={league.name} leagueSlug={league.slug} standings={standings} />
          </div>
        )}

        <AffiliateBanner bookmakerName="1xBet" affiliateUrl="https://1xbet.com/?ref=360foot" bonus="Bonus 100% jusqu'à 130€" />

        {/* Derniers resultats */}
        {recentMatches && recentMatches.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Derniers resultats</h2>
            <div className="space-y-3">
              {recentMatches.map((match: Record<string, unknown>) => {
                const homeTeam = match.home_team as Record<string, unknown> | null;
                const awayTeam = match.away_team as Record<string, unknown> | null;
                return (
                  <MatchCard
                    key={match.id as string}
                    slug={match.slug as string}
                    homeTeam={(homeTeam?.name as string) || ""}
                    awayTeam={(awayTeam?.name as string) || ""}
                    homeScore={match.score_home as number | null}
                    awayScore={match.score_away as number | null}
                    status={match.status as string}
                    date={match.date as string}
                    leagueName=""
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Articles */}
        {articles && articles.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Actualites</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article: Record<string, unknown>) => (
                <ArticleCard
                  key={article.id as string}
                  slug={article.slug as string}
                  title={article.title as string}
                  excerpt={(article.excerpt as string) || ""}
                  type={article.type as string}
                  publishedAt={article.published_at as string}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
