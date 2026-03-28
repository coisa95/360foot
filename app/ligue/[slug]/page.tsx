import { createClient } from "@/lib/supabase";
import { StandingsTable } from "@/components/standings-table";
import { MatchCard } from "@/components/match-card";
import { ArticleCard } from "@/components/article-card";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { Card } from "@/components/ui/card";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
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
  const fullDesc = `Classement complet de la ${league.name}, meilleurs buteurs, passeurs, derniers résultats et toute l'actualité.`;
  const description = fullDesc.length > 155 ? fullDesc.slice(0, 152) + "..." : fullDesc;

  return {
    title,
    description,
    alternates: { canonical: `https://360-foot.com/ligue/${slug}` },
    openGraph: { title, description, type: "website", url: `https://360-foot.com/ligue/${slug}`, images: [`/api/og?title=${encodeURIComponent(title)}`] },
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

  // Lookup player slugs for top scorers
  const scorerNames = topScorers.slice(0, 5).map((p: any) => p.name).filter(Boolean);
  const scorerSlugMap: Record<string, string> = {};
  if (scorerNames.length > 0) {
    const { data: scorerPlayers } = await supabase
      .from("players")
      .select("name, slug")
      .in("name", scorerNames);
    if (scorerPlayers) {
      for (const p of scorerPlayers) scorerSlugMap[p.name] = p.slug;
    }
  }

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsOrganization",
            name: league.name,
            sport: "Football",
            url: `https://360-foot.com/ligue/${slug}`,
          }),
        }}
      />
      {/* Main grid: on mobile = classement+buteurs first, then matchs+actus. On desktop = 2 cols */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Right sidebar on desktop, but first on mobile */}
        <div className="order-1 lg:order-2 space-y-4">
          {/* Classement top 5 */}
          {standings.length > 0 && (
            <StandingsTable
              leagueName="Classement"
              leagueSlug={league.slug}
              standings={standings}
              compact
            />
          )}

          {/* Top Buteurs */}
          {topScorers.length > 0 && (
            <Card className="border-gray-800 bg-dark-card p-3">
              <h2 className="text-sm font-bold text-lime-400 mb-2">Meilleurs buteurs</h2>
              <div className="space-y-1.5">
                {topScorers.slice(0, 5).map((player: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-4 text-center text-[10px] font-bold text-gray-500">{idx + 1}</span>
                    {player.photo && (
                      <Image src={player.photo} alt={`Photo ${player.name}`} width={20} height={20} className="h-5 w-5 rounded-full object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      {scorerSlugMap[player.name] ? (
                        <Link href={`/joueur/${scorerSlugMap[player.name]}`} className="font-medium text-white text-[11px] truncate block hover:text-lime-400 transition-colors">{player.name}</Link>
                      ) : (
                        <p className="font-medium text-white text-[11px] truncate">{player.name}</p>
                      )}
                      <p className="text-[9px] text-gray-500 truncate">{player.team}</p>
                    </div>
                    <span className="text-xs font-bold text-lime-400">{player.goals}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Left: Matchs + Actus */}
        <div className="order-2 lg:order-1 lg:col-span-2 space-y-4">
          {/* Matchs de la semaine */}
          <div>
            <h2 className="text-sm sm:text-lg font-bold mb-2 flex items-center justify-between">
              Matchs de la semaine
              <Link href={`/ligue/${slug}/calendrier`} className="text-[10px] sm:text-xs text-lime-400 hover:underline font-normal">
                Voir tout →
              </Link>
            </h2>
            {weekMatches && weekMatches.length > 0 ? (
              <div className="space-y-1.5">
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
              <h2 className="text-sm sm:text-lg font-bold mb-2 flex items-center justify-between">
                Dernières actualités
                <Link href={`/ligue/${slug}/actualites`} className="text-[10px] sm:text-xs text-lime-400 hover:underline font-normal">
                  Voir tout →
                </Link>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
      </div>

      <AffiliateTrio />
    </>
  );
}
