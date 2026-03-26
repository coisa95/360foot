import { createClient } from "@/lib/supabase";
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
import Link from "next/link";

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createClient();

  const { data: team } = await supabase
    .from("teams")
    .select("*, league:leagues!league_id(*)")
    .eq("slug", slug)
    .single();

  if (!team) return { title: "Equipe introuvable - 360 Foot" };

  const title = `${team.name} - Effectif, resultats et classement - 360 Foot`;
  const description = `Toutes les infos sur ${team.name} : effectif, derniers resultats, classement en ${team.league.name} et actualites.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://360-foot.com/equipe/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://360-foot.com/equipe/${slug}`,
    },
  };
}

export default async function TeamPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createClient();

  const { data: team } = await supabase
    .from("teams")
    .select("*, league:leagues!league_id(*)")
    .eq("slug", slug)
    .single();

  if (!team) notFound();

  const now = new Date().toISOString();

  // Fetch recent matches (past)
  const { data: recentMatches } = await supabase
    .from("matches")
    .select("*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), league:leagues!league_id(*)")
    .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
    .lte("date", now)
    .order("date", { ascending: false })
    .limit(5);

  // Fetch upcoming matches (future)
  const { data: upcomingMatches } = await supabase
    .from("matches")
    .select("*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), league:leagues!league_id(*)")
    .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
    .gt("date", now)
    .order("date", { ascending: true })
    .limit(5);

  const { data: standings } = await supabase
    .from("standings")
    .select("*")
    .eq("league_id", team.league_id)
    .eq("team_id", team.id)
    .single();

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("team_id", team.id)
    .order("position", { ascending: true });

  // Fetch articles related to this team (title or content mentions team name)
  const { data: teamArticles } = await supabase
    .from("articles")
    .select("*, league:leagues!league_id(name)")
    .not("published_at", "is", null)
    .or(`title.ilike.%${team.name}%,content.ilike.%${team.name}%`)
    .order("created_at", { ascending: false })
    .limit(6);

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: team.league.name, href: `/ligue/${team.league.slug}` },
    { label: team.name },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: team.name,
    sport: "Football",
    memberOf: {
      "@type": "SportsOrganization",
      name: team.league.name,
    },
    coach: team.coach
      ? { "@type": "Person", name: team.coach }
      : undefined,
    location: team.venue
      ? { "@type": "Place", name: team.venue }
      : undefined,
  };

  function renderMatchList(matches: Record<string, unknown>[]) {
    return (
      <div className="space-y-3">
        {matches.map((match: Record<string, unknown>) => {
          const homeTeam = match.home_team as Record<string, unknown> | null;
          const awayTeam = match.away_team as Record<string, unknown> | null;
          const league = match.league as Record<string, unknown> | null;
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
              leagueName={(league?.name as string) || ""}
            />
          );
        })}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-dark-bg text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container mx-auto px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        {/* Informations de l'equipe */}
        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {team.logo_url && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={team.logo_url}
                  alt={`Logo ${team.name}`}
                  className="h-16 w-16 object-contain"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-lime-400">{team.name}</h1>
                <div className="flex flex-wrap gap-4 mt-3 text-gray-400">
                  {team.country && (
                    <span>Pays : {team.country}</span>
                  )}
                  {team.coach && (
                    <span>Entraineur : {team.coach}</span>
                  )}
                  {team.venue && (
                    <span>Stade : {team.venue}</span>
                  )}
                </div>
              </div>
            </div>
            <Link href={`/ligue/${team.league.slug}`}>
              <Badge className="bg-lime-500/20 text-lime-400 border-lime-500/30">
                {team.league.name}
              </Badge>
            </Link>
          </div>
        </Card>

        {/* Position au classement */}
        {standings && (
          <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
            <h2 className="text-lg font-bold text-lime-400 mb-4">Position au classement</h2>
            <Separator className="bg-gray-800 mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4 text-center">
              <div>
                <p className="text-gray-400 text-sm">Position</p>
                <p className="text-2xl font-bold text-lime-400">{standings.position}</p>
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

        {/* Matchs a venir */}
        {upcomingMatches && upcomingMatches.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-lime-400 mb-4">Matchs a venir</h2>
            {renderMatchList(upcomingMatches)}
          </div>
        )}

        {/* Derniers matchs */}
        {recentMatches && recentMatches.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-lime-400 mb-4">Derniers resultats</h2>
            {renderMatchList(recentMatches)}
          </div>
        )}

        {/* Articles lies a l'equipe */}
        {teamArticles && teamArticles.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-lime-400 mb-4">
              Actualites {team.name}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teamArticles.map((article: Record<string, unknown>) => {
                const league = article.league as Record<string, unknown> | null;
                return (
                  <ArticleCard
                    key={article.id as string}
                    slug={article.slug as string}
                    title={article.title as string}
                    excerpt={(article.excerpt as string) || ""}
                    type={(article.type as string) || "news"}
                    publishedAt={(article.created_at as string) || ""}
                    leagueName={(league?.name as string) || undefined}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Effectif */}
        {players && players.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-lime-400 mb-4">Effectif</h2>
            <Separator className="bg-gray-800 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map((player: Record<string, unknown>) => (
                <PlayerCard
                  key={player.id as string}
                  slug={player.slug as string}
                  name={player.name as string}
                  position={(player.position as string) || ""}
                  nationality={(player.nationality as string) || ""}
                  age={player.age as number | undefined}
                />
              ))}
            </div>
          </div>
        )}

        {/* Partenaires */}
        <div className="mt-12">
          <AffiliateTrio />
        </div>
      </div>
    </main>
  );
}
