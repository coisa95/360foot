import { createClient } from "@/lib/supabase";
import { StandingsTable } from "@/components/standings-table";
import { MatchCard } from "@/components/match-card";
import { ArticleCard } from "@/components/article-card";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { Card } from "@/components/ui/card";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

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

  // Standings + top scorers/assists
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

  // Matches this week (past + upcoming within 7 days)
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: weekMatches } = await supabase
    .from("matches")
    .select("*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)")
    .eq("league_id", league.id)
    .gte("date", weekAgo)
    .lte("date", weekAhead)
    .order("date", { ascending: true })
    .limit(10);

  // Latest articles
  const { data: articles } = await supabase
    .from("articles")
    .select("*")
    .eq("league_id", league.id)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(3);

  return (
    <>
      {/* Main grid: left content + right sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Matchs de la semaine */}
        <div className="lg:col-span-2 space-y-6">
          {/* Matchs de la semaine */}
          <div>
            <h2 className="text-lg font-bold mb-3 flex items-center justify-between">
              Matchs de la semaine
              <Link href={`/ligue/${slug}/calendrier`} className="text-xs text-lime-400 hover:underline font-normal">
                Voir tout →
              </Link>
            </h2>
            {weekMatches && weekMatches.length > 0 ? (
              <div className="space-y-2">
                {weekMatches.map((match: any) => (
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
            ) : (
              <p className="text-sm text-gray-500 py-4">Aucun match cette semaine.</p>
            )}
          </div>

          {/* Dernières actus */}
          {articles && articles.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-3 flex items-center justify-between">
                Dernières actualités
                <Link href={`/ligue/${slug}/actualites`} className="text-xs text-lime-400 hover:underline font-normal">
                  Voir tout →
                </Link>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

        {/* Right sidebar: Classement top 5 + Buteurs */}
        <div className="space-y-6">
          {/* Classement top 5 */}
          {standings.length > 0 && (
            <div>
              <StandingsTable
                leagueName="Classement"
                leagueSlug={league.slug}
                standings={standings}
                compact
              />
            </div>
          )}

          {/* Top Buteurs */}
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
        </div>
      </div>

      <AffiliateTrio />
    </>
  );
}
