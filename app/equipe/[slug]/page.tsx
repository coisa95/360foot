import { createClient } from "@/lib/supabase";
import { safeJsonLd } from "@/lib/json-ld";
import { Breadcrumb } from "@/components/breadcrumb";
import { MatchCard } from "@/components/match-card";
import { ArticleCard } from "@/components/article-card";
import { PlayerCard } from "@/components/player-card";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 900;

type Props = {
  params: Promise<{ slug: string }>;
};

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createClient();

  const { data: team } = await supabase
    .from("teams")
    .select("name,slug,league:leagues!league_id(name,slug)")
    .eq("slug", slug)
    .single() as { data: any };

  if (!team) return { title: "Équipe introuvable - 360 Foot" };

  const leagueName = team.league?.name || "";
  const title = `Effectif ${team.name} - Joueurs et compositions - 360 Foot`;
  const fullDesc = leagueName
    ? `Effectif complet de ${team.name} : photos des joueurs, compositions, résultats, stats et classement en ${leagueName}.`
    : `Effectif complet de ${team.name} : photos des joueurs, compositions, résultats, stats et actualités.`;
  const description = fullDesc.length > 155 ? fullDesc.slice(0, 152) + "..." : fullDesc;

  return {
    title,
    description,
    alternates: { canonical: `https://360-foot.com/equipe/${slug}` },
    openGraph: { title, description, type: "website", url: `https://360-foot.com/equipe/${slug}`, locale: "fr_FR", images: [`https://360-foot.com/api/og?title=${encodeURIComponent(title)}`] },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [`https://360-foot.com/api/og?title=${encodeURIComponent(title)}`],
    },
  };
}

export default async function TeamPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createClient();

  const { data: team } = await supabase
    .from("teams")
    .select("id,name,slug,logo_url,country,coach,coach_nationality,venue,league_id,api_football_id,team_stats_json,league:leagues!league_id(name,slug)")
    .eq("slug", slug)
    .single() as { data: any };

  if (!team) notFound();

  const now = new Date().toISOString();
  const matchSelect = "id,slug,date,score_home,score_away,status,home_team:teams!home_team_id(name,slug),away_team:teams!away_team_id(name,slug),league:leagues!league_id(name)";

  // Parallelize all independent queries
  const [
    { data: recentMatches },
    { data: upcomingMatches },
    { data: standingsRow },
    { data: players },
    { data: teamArticles },
  ] = await Promise.all([
    supabase
      .from("matches")
      .select(matchSelect)
      .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
      .lte("date", now)
      .order("date", { ascending: false })
      .limit(5),
    supabase
      .from("matches")
      .select(matchSelect)
      .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
      .gt("date", now)
      .order("date", { ascending: true })
      .limit(5),
    supabase
      .from("standings")
      .select("data_json")
      .eq("league_id", team.league_id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("players")
      .select("id,slug,name,position,nationality,age,number,photo_url,api_football_id")
      .eq("team_id", team.id)
      .order("position", { ascending: true }),
    supabase
      .from("articles")
      .select("id,slug,title,excerpt,type,created_at,og_image_url,league:leagues!league_id(name)")
      .not("published_at", "is", null)
      .ilike("title", `%${team.name}%`)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  // Find this team's position in the standings data
  let standings: any = null;
  if (standingsRow?.data_json) {
    const allStandings = Array.isArray(standingsRow.data_json) ? standingsRow.data_json : [];
    const teamEntry = allStandings.find((s: any) =>
      s.team_api_id === team.api_football_id ||
      s.team_name?.toLowerCase() === team.name?.toLowerCase()
    );
    if (teamEntry) {
      standings = {
        position: teamEntry.rank,
        points: teamEntry.points,
        played: teamEntry.played || 0,
        won: teamEntry.won || 0,
        drawn: teamEntry.drawn || 0,
        lost: teamEntry.lost || 0,
        goals_for: teamEntry.goals_for || 0,
        goals_against: teamEntry.goals_against || 0,
      };
    }
  }

  // Team statistics
  const teamStats = team.team_stats_json as any | null;

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    ...(team.league ? [{ label: team.league.name, href: `/ligue/${team.league.slug}` }] : []),
    { label: team.name },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: team.name,
    sport: "Football",
    memberOf: team.league ? { "@type": "SportsOrganization", name: team.league.name } : undefined,
    coach: team.coach ? { "@type": "Person", name: team.coach } : undefined,
    location: team.venue ? { "@type": "Place", name: team.venue } : undefined,
    athlete: players && players.length > 0
      ? players.slice(0, 30).map((p: any) => ({
          "@type": "Person",
          name: p.name,
          nationality: p.nationality || undefined,
        }))
      : undefined,
  };

  function renderMatchList(matches: any[]) {
    return (
      <div className="space-y-3">
        {matches.map((match: any) => (
          <MatchCard
            key={match.id}
            slug={match.slug}
            homeTeam={match.home_team?.name || ""}
            awayTeam={match.away_team?.name || ""}
            homeScore={match.score_home}
            awayScore={match.score_away}
            status={match.status}
            date={match.date}
            leagueName={match.league?.name || ""}
          />
        ))}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-transparent text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      <div className="container mx-auto px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        {/* Team Info Card */}
        <Card className="bg-white/[0.02] border-gray-800 p-6 mt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {team.logo_url && (
                <Image src={team.logo_url} alt={`Logo ${team.name}`} width={64} height={64} className="h-16 w-16 object-contain" />
              )}
              <div>
                <h1 className="font-display text-3xl font-bold text-emerald-400">{team.name}</h1>
                <div className="flex flex-wrap gap-4 mt-3 text-gray-400 text-sm">
                  {team.country && <span>🌍 {team.country}</span>}
                  {team.coach && (
                    <span className="flex items-center gap-1">
                      👨‍💼 {team.coach}
                      {team.coach_nationality && (
                        <span className="text-xs text-gray-500">({team.coach_nationality})</span>
                      )}
                    </span>
                  )}
                  {team.venue && <span>🏟️ {team.venue}</span>}
                </div>
              </div>
            </div>
            {team.league && (
              <Link href={`/ligue/${team.league.slug}`}>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  {team.league.name}
                </Badge>
              </Link>
            )}
          </div>
        </Card>

        {/* Position au classement */}
        {standings && (
          <Card className="bg-white/[0.02] border-gray-800 p-6 mt-6">
            <h2 className="font-display text-lg font-bold text-emerald-400 mb-4">Position au classement</h2>
            <Separator className="bg-gray-800 mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4 text-center">
              <div>
                <p className="text-gray-400 text-sm">Position</p>
                <p className="text-2xl font-bold text-emerald-400">{standings.position}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Points</p>
                <p className="text-2xl font-bold">{standings.points}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">MJ</p>
                <p className="text-2xl font-bold">{standings.played}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">V</p>
                <p className="text-2xl font-bold text-green-400">{standings.won}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">N</p>
                <p className="text-2xl font-bold text-gray-400">{standings.drawn}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">D</p>
                <p className="text-2xl font-bold text-red-400">{standings.lost}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Diff</p>
                <p className="text-2xl font-bold">
                  {standings.goals_for - standings.goals_against > 0 ? "+" : ""}
                  {standings.goals_for - standings.goals_against}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Team Statistics */}
        {teamStats && (
          <Card className="card-glass border-gray-800 p-6 mt-6">
            <h2 className="font-display text-lg font-bold text-emerald-400 mb-4">📊 Statistiques de la saison</h2>
            <Separator className="bg-gray-800 mb-4" />

            {/* Form */}
            {teamStats.form && (
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">Forme récente</p>
                <div className="flex gap-1">
                  {teamStats.form.slice(-10).split("").map((r: string, i: number) => (
                    <span key={i} className={`inline-flex h-7 w-7 items-center justify-center rounded text-xs font-bold ${
                      r === "W" ? "bg-green-500/20 text-green-400" :
                      r === "D" ? "bg-gray-500/20 text-gray-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {r === "W" ? "V" : r === "D" ? "N" : "D"}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Goals */}
              {teamStats.goals?.for?.total && (
                <>
                  <div className="rounded-lg bg-white/[0.02] p-3 text-center">
                    <p className="text-xs text-gray-500">Buts marqués</p>
                    <p className="text-2xl font-bold text-emerald-400">{teamStats.goals.for.total.total}</p>
                    <p className="text-[10px] text-gray-500">
                      🏠 {teamStats.goals.for.total.home} | ✈️ {teamStats.goals.for.total.away}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/[0.02] p-3 text-center">
                    <p className="text-xs text-gray-500">Buts encaissés</p>
                    <p className="text-2xl font-bold text-red-400">{teamStats.goals.against?.total?.total || 0}</p>
                    <p className="text-[10px] text-gray-500">
                      🏠 {teamStats.goals.against?.total?.home || 0} | ✈️ {teamStats.goals.against?.total?.away || 0}
                    </p>
                  </div>
                </>
              )}

              {/* Goals average */}
              {teamStats.goals?.for?.average && (
                <div className="rounded-lg bg-white/[0.02] p-3 text-center">
                  <p className="text-xs text-gray-500">Moy. buts/match</p>
                  <p className="text-2xl font-bold text-white">{teamStats.goals.for.average.total}</p>
                </div>
              )}

              {/* Clean sheets */}
              {teamStats.clean_sheet && (
                <div className="rounded-lg bg-white/[0.02] p-3 text-center">
                  <p className="text-xs text-gray-500">Clean sheets</p>
                  <p className="text-2xl font-bold text-green-400">{teamStats.clean_sheet.total}</p>
                </div>
              )}

              {/* Failed to score */}
              {teamStats.failed_to_score && (
                <div className="rounded-lg bg-white/[0.02] p-3 text-center">
                  <p className="text-xs text-gray-500">Sans marquer</p>
                  <p className="text-2xl font-bold text-red-400">{teamStats.failed_to_score.total}</p>
                </div>
              )}

              {/* Penalties */}
              {teamStats.penalty?.scored && (
                <div className="rounded-lg bg-white/[0.02] p-3 text-center">
                  <p className="text-xs text-gray-500">Penalties</p>
                  <p className="text-2xl font-bold text-white">
                    {teamStats.penalty.scored.total}/{teamStats.penalty.scored.total + (teamStats.penalty.missed?.total || 0)}
                  </p>
                  <p className="text-[10px] text-gray-500">{teamStats.penalty.scored.percentage} réussite</p>
                </div>
              )}

              {/* Biggest win streak */}
              {teamStats.biggest?.streak && (
                <div className="rounded-lg bg-white/[0.02] p-3 text-center">
                  <p className="text-xs text-gray-500">Plus longue série</p>
                  <p className="text-2xl font-bold text-green-400">{teamStats.biggest.streak.wins}V</p>
                  <p className="text-[10px] text-gray-500">{teamStats.biggest.streak.draws}N · {teamStats.biggest.streak.loses}D</p>
                </div>
              )}
            </div>

            {/* Preferred formations */}
            {teamStats.lineups && teamStats.lineups.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">Formations utilisées</p>
                <div className="flex flex-wrap gap-2">
                  {teamStats.lineups.map((l: any, i: number) => (
                    <Badge key={i} className="bg-white/[0.02] text-gray-300 border-gray-700">
                      {l.formation} <span className="ml-1 text-emerald-400">({l.played}x)</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Matchs à venir */}
        {upcomingMatches && upcomingMatches.length > 0 && (
          <div className="mt-8">
            <h2 className="font-display text-lg font-bold text-emerald-400 mb-4">Matchs à venir</h2>
            {renderMatchList(upcomingMatches)}
          </div>
        )}

        {/* Derniers matchs */}
        {recentMatches && recentMatches.length > 0 && (
          <div className="mt-8">
            <h2 className="font-display text-lg font-bold text-emerald-400 mb-4">Derniers résultats</h2>
            {renderMatchList(recentMatches)}
          </div>
        )}

        {/* Articles */}
        {teamArticles && teamArticles.length > 0 && (
          <div className="mt-8">
            <h2 className="font-display text-lg font-bold text-emerald-400 mb-4">
              Actualités {team.name}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teamArticles.map((article: any) => (
                <ArticleCard
                  key={article.id}
                  slug={article.slug}
                  title={article.title}
                  excerpt={article.excerpt || ""}
                  type={article.type || "news"}
                  publishedAt={article.created_at || ""}
                  leagueName={article.league?.name || undefined}
                  imageUrl={article.og_image_url || null}
                />
              ))}
            </div>
          </div>
        )}

        {/* Effectif */}
        {players && players.length > 0 && (() => {
          const positionOrder = ["Goalkeeper", "Defender", "Midfielder", "Attacker"];
          const positionLabels: Record<string, string> = {
            Goalkeeper: "Gardiens",
            Defender: "Défenseurs",
            Midfielder: "Milieux",
            Attacker: "Attaquants",
          };
          const grouped = positionOrder
            .map((pos) => ({
              position: pos,
              label: positionLabels[pos],
              items: players.filter((p: any) => p.position === pos),
            }))
            .filter((g) => g.items.length > 0);

          // Players with unknown/other positions
          const knownPositions = new Set(positionOrder);
          const others = players.filter((p: any) => !knownPositions.has(p.position));

          return (
            <div className="mt-8">
              <h2 className="font-display text-lg font-bold text-emerald-400 mb-4">
                Effectif ({players.length} joueurs)
              </h2>
              <Separator className="bg-gray-800 mb-6" />

              {grouped.map((group) => (
                <div key={group.position} className="mb-6">
                  <h3 className="font-display text-md font-semibold text-gray-300 mb-3">
                    {group.label} ({group.items.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.items.map((player: any) => (
                      <PlayerCard
                        key={player.id}
                        slug={player.slug}
                        name={player.name}
                        position={player.position || ""}
                        nationality={player.nationality || ""}
                        age={player.age}
                        number={player.number}
                        photoUrl={player.photo_url || (player.api_football_id ? `https://media.api-sports.io/football/players/${player.api_football_id}.png` : null)}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {others.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-display text-md font-semibold text-gray-300 mb-3">
                    Autres ({others.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {others.map((player: any) => (
                      <PlayerCard
                        key={player.id}
                        slug={player.slug}
                        name={player.name}
                        position={player.position || ""}
                        nationality={player.nationality || ""}
                        age={player.age}
                        number={player.number}
                        photoUrl={player.photo_url || (player.api_football_id ? `https://media.api-sports.io/football/players/${player.api_football_id}.png` : null)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        <div className="mt-12">
          <AffiliateTrio />
        </div>
      </div>
    </main>
  );
}
