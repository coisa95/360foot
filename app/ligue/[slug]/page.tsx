import { createClient } from "@/lib/supabase";
import { Breadcrumb } from "@/components/breadcrumb";
import { StandingsTable } from "@/components/standings-table";
import { MatchCard } from "@/components/match-card";
import { ArticleCard } from "@/components/article-card";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { Card } from "@/components/ui/card";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
};

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createClient();

  const { data: league } = await supabase
    .from("leagues")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!league) return { title: "Ligue introuvable - 360 Foot" };

  const title = `Classement ${league.name} - Résultats et actualités - 360 Foot`;
  const description = `Classement complet de la ${league.name}, meilleurs buteurs, passeurs, derniers résultats et toute l'actualité.`;

  return {
    title,
    description,
    alternates: { canonical: `https://360foot.info/ligue/${slug}` },
    openGraph: { title, description, type: "website", url: `https://360foot.info/ligue/${slug}` },
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
    .select("data_json, top_scorers_json, top_assists_json")
    .eq("league_id", league.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  const standings = ((standingsData?.data_json as any[]) || []).map((row: any) => ({
    rank: row.rank || 0,
    teamName: row.team_name || "",
    teamSlug: row.team_slug || "",
    played: row.played || 0,
    won: row.won || 0,
    drawn: row.drawn || 0,
    lost: row.lost || 0,
    goalsFor: row.goals_for || 0,
    goalsAgainst: row.goals_against || 0,
    goalDiff: row.goal_diff || 0,
    points: row.points || 0,
  }));

  const topScorers = (standingsData?.top_scorers_json as any[]) || [];
  const topAssists = (standingsData?.top_assists_json as any[]) || [];

  const { data: recentMatches } = await supabase
    .from("matches")
    .select("*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), league:leagues!league_id(*)")
    .eq("league_id", league.id)
    .eq("status", "FT")
    .order("date", { ascending: false })
    .limit(10);

  // Upcoming matches
  const now = new Date().toISOString();
  const { data: upcomingMatches } = await supabase
    .from("matches")
    .select("*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)")
    .eq("league_id", league.id)
    .eq("status", "NS")
    .gte("date", now)
    .order("date", { ascending: true })
    .limit(5);

  const { data: articles } = await supabase
    .from("articles")
    .select("*")
    .eq("league_id", league.id)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(6);

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: league.name },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    name: league.name,
    sport: "Football",
    location: { "@type": "Place", name: league.country },
  };

  return (
    <main className="min-h-screen bg-dark-bg text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container mx-auto px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        <div className="mt-6 flex items-center gap-4">
          {league.logo_url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={league.logo_url} alt={league.name} className="h-12 w-12 object-contain" />
          )}
          <div>
            <h1 className="text-3xl font-bold text-lime-400">{league.name}</h1>
            {league.country && <p className="text-gray-400 mt-1">{league.country}</p>}
          </div>
        </div>

        {/* Classement */}
        {standings.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Classement</h2>
            <StandingsTable leagueName={league.name} leagueSlug={league.slug} standings={standings} />
          </div>
        )}

        {/* Top Scorers & Assists side by side */}
        {(topScorers.length > 0 || topAssists.length > 0) && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Buteurs */}
            {topScorers.length > 0 && (
              <Card className="border-gray-800 bg-dark-card p-4 sm:p-6">
                <h2 className="text-lg font-bold text-lime-400 mb-4">⚽ Meilleurs buteurs</h2>
                <div className="space-y-3">
                  {topScorers.map((player: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="w-6 text-center font-bold text-gray-500">{idx + 1}</span>
                      {player.photo && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={player.photo} alt={player.name} className="h-8 w-8 rounded-full object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate">{player.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{player.team}</span>
                          {player.nationality && (
                            <span>• {player.nationality}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-lime-400">{player.goals}</span>
                        <p className="text-[10px] text-gray-500">{player.appearances} matchs</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Top Passeurs */}
            {topAssists.length > 0 && (
              <Card className="border-gray-800 bg-dark-card p-4 sm:p-6">
                <h2 className="text-lg font-bold text-lime-400 mb-4">🎯 Meilleurs passeurs</h2>
                <div className="space-y-3">
                  {topAssists.map((player: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="w-6 text-center font-bold text-gray-500">{idx + 1}</span>
                      {player.photo && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={player.photo} alt={player.name} className="h-8 w-8 rounded-full object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate">{player.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{player.team}</span>
                          {player.nationality && (
                            <span>• {player.nationality}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-lime-400">{player.assists}</span>
                        <p className="text-[10px] text-gray-500">{player.appearances} matchs</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        <AffiliateTrio />

        {/* Matchs à venir */}
        {upcomingMatches && upcomingMatches.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Matchs à venir</h2>
            <div className="space-y-3">
              {upcomingMatches.map((match: any) => (
                <MatchCard
                  key={match.id}
                  slug={match.slug}
                  homeTeam={match.home_team?.name || ""}
                  awayTeam={match.away_team?.name || ""}
                  homeScore={null}
                  awayScore={null}
                  status={match.status}
                  date={match.date}
                  leagueName=""
                />
              ))}
            </div>
          </div>
        )}

        {/* Derniers résultats */}
        {recentMatches && recentMatches.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Derniers résultats</h2>
            <div className="space-y-3">
              {recentMatches.map((match: any) => (
                <MatchCard
                  key={match.id}
                  slug={match.slug}
                  homeTeam={match.home_team?.name || ""}
                  awayTeam={match.away_team?.name || ""}
                  homeScore={match.score_home}
                  awayScore={match.score_away}
                  status={match.status}
                  date={match.date}
                  leagueName=""
                />
              ))}
            </div>
          </div>
        )}

        {/* Articles */}
        {articles && articles.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Actualités</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article: any) => (
                <ArticleCard
                  key={article.id}
                  slug={article.slug}
                  title={article.title}
                  excerpt={article.excerpt || ""}
                  type={article.type}
                  publishedAt={article.published_at}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
