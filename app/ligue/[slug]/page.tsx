import { createClient } from "@/lib/supabase";
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
    .select("name")
    .eq("slug", slug)
    .single();

  if (!league) return { title: "Ligue introuvable - 360 Foot" };

  const title = `${league.name} - Classement, résultats et actualités`;
  const description = `Classement complet de la ${league.name}, meilleurs buteurs, passeurs, derniers résultats et toute l'actualité.`;

  return {
    title,
    description,
    alternates: { canonical: `https://360-foot.com/ligue/${slug}` },
    openGraph: { title, description, type: "website", url: `https://360-foot.com/ligue/${slug}` },
  };
}

export default async function LeagueResumePage({ params }: Props) {
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
    .limit(5);

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

  return (
    <>
      {/* Classement compact + Top buteurs/passeurs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classement */}
        <div className="lg:col-span-2">
          {standings.length > 0 && (
            <StandingsTable leagueName={league.name} leagueSlug={league.slug} standings={standings} />
          )}
        </div>

        {/* Top Buteurs & Passeurs */}
        <div className="space-y-6">
          {topScorers.length > 0 && (
            <Card className="border-gray-800 bg-dark-card p-4">
              <h2 className="text-sm font-bold text-lime-400 mb-3">Meilleurs buteurs</h2>
              <div className="space-y-2">
                {topScorers.slice(0, 5).map((player: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-5 text-center text-xs font-bold text-gray-500">{idx + 1}</span>
                    {player.photo && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={player.photo} alt={player.name} className="h-6 w-6 rounded-full object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-xs truncate">{player.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{player.team}</p>
                    </div>
                    <span className="text-sm font-bold text-lime-400">{player.goals}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {topAssists.length > 0 && (
            <Card className="border-gray-800 bg-dark-card p-4">
              <h2 className="text-sm font-bold text-lime-400 mb-3">Meilleurs passeurs</h2>
              <div className="space-y-2">
                {topAssists.slice(0, 5).map((player: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-5 text-center text-xs font-bold text-gray-500">{idx + 1}</span>
                    {player.photo && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={player.photo} alt={player.name} className="h-6 w-6 rounded-full object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-xs truncate">{player.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{player.team}</p>
                    </div>
                    <span className="text-sm font-bold text-lime-400">{player.assists}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <AffiliateTrio />

      {/* Matchs à venir + Derniers résultats side by side */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {upcomingMatches && upcomingMatches.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-3">Matchs à venir</h2>
            <div className="space-y-2">
              {upcomingMatches.map((match: any) => (
                <MatchCard
                  key={match.id}
                  slug={match.slug}
                  homeTeam={match.home_team?.name || ""}
                  awayTeam={match.away_team?.name || ""}
                  homeTeamSlug={match.home_team?.slug}
                  awayTeamSlug={match.away_team?.slug}
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

        {recentMatches && recentMatches.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-3">Derniers résultats</h2>
            <div className="space-y-2">
              {recentMatches.map((match: any) => (
                <MatchCard
                  key={match.id}
                  slug={match.slug}
                  homeTeam={match.home_team?.name || ""}
                  awayTeam={match.away_team?.name || ""}
                  homeTeamSlug={match.home_team?.slug}
                  awayTeamSlug={match.away_team?.slug}
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
      </div>

      {/* Articles */}
      {articles && articles.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-3">Actualités</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </>
  );
}
