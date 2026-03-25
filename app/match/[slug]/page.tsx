import { createClient } from "@/lib/supabase";
import { Breadcrumb } from "@/components/breadcrumb";
import { ArticleCard } from "@/components/article-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AffiliateButton } from "@/components/affiliate-button";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createClient();

  const { data: match } = await supabase
    .from("matches")
    .select("*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), league:leagues!league_id(*)")
    .eq("slug", slug)
    .single();

  if (!match) return { title: "Match introuvable - 360 Foot" };

  const title =
    match.status === "FT"
      ? `Resultat ${match.home_team.name} vs ${match.away_team.name} (${match.home_score}-${match.away_score}) - 360 Foot`
      : `${match.home_team.name} vs ${match.away_team.name} - Apercu du match - 360 Foot`;

  const description =
    match.status === "FT"
      ? `Score final : ${match.home_team.name} ${match.home_score} - ${match.away_score} ${match.away_team.name}. ${match.league.name}. Decouvrez le resume, les buts et les statistiques du match.`
      : `Apercu du match ${match.home_team.name} vs ${match.away_team.name} en ${match.league.name}. Composition, forme et pronostics.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://360-foot.com/match/${slug}`,
    },
  };
}

export default async function MatchPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createClient();

  const { data: match } = await supabase
    .from("matches")
    .select("*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), league:leagues!league_id(*)")
    .eq("slug", slug)
    .single();

  if (!match) notFound();

  const { data: relatedArticle } = await supabase
    .from("articles")
    .select("*")
    .eq("match_id", match.id)
    .limit(1)
    .single();

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: match.league.name, href: `/ligue/${match.league.slug}` },
    { label: `${match.home_team.name} vs ${match.away_team.name}` },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${match.home_team.name} vs ${match.away_team.name}`,
    startDate: match.date,
    location: {
      "@type": "Place",
      name: match.venue || match.home_team.venue || "Stade",
    },
    homeTeam: {
      "@type": "SportsTeam",
      name: match.home_team.name,
    },
    awayTeam: {
      "@type": "SportsTeam",
      name: match.away_team.name,
    },
    competitor: [
      { "@type": "SportsTeam", name: match.home_team.name },
      { "@type": "SportsTeam", name: match.away_team.name },
    ],
  };

  return (
    <main className="min-h-screen bg-dark-bg text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container mx-auto px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        {/* En-tete du match */}
        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <div className="text-center mb-4">
            <Badge className="bg-lime-500/20 text-lime-400 border-lime-500/30">
              {match.league.name}
            </Badge>
            <p className="text-gray-400 text-sm mt-2">
              {new Date(match.date).toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {match.status === "FT" ? (
            /* Score final */
            <div className="flex items-center justify-center gap-8 my-8">
              <div className="text-center flex-1">
                <h2 className="text-xl font-bold">{match.home_team.name}</h2>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-lime-400">
                  {match.home_score} - {match.away_score}
                </div>
                <Badge className="mt-2 bg-red-500/20 text-red-400 border-red-500/30">
                  Termine
                </Badge>
              </div>
              <div className="text-center flex-1">
                <h2 className="text-xl font-bold">{match.away_team.name}</h2>
              </div>
            </div>
          ) : (
            /* Apercu du match */
            <div className="flex items-center justify-center gap-8 my-8">
              <div className="text-center flex-1">
                <h2 className="text-xl font-bold">{match.home_team.name}</h2>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-400">VS</div>
                <Badge className="mt-2 bg-lime-500/20 text-lime-400 border-lime-500/30">
                  A venir
                </Badge>
              </div>
              <div className="text-center flex-1">
                <h2 className="text-xl font-bold">{match.away_team.name}</h2>
              </div>
            </div>
          )}
        </Card>

        {/* Evenements du match */}
        {match.status === "FT" && match.events && (
          <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
            <h3 className="text-lg font-bold text-lime-400 mb-4">Evenements du match</h3>
            <Separator className="bg-gray-800 mb-4" />
            <div className="space-y-3">
              {(match.events as Array<{ minute: number; type: string; player: string; team: string }>).map(
                (event, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span className="text-lime-400 font-mono w-8">{event.minute}&apos;</span>
                    <Badge
                      className={
                        event.type === "goal"
                          ? "bg-lime-500/20 text-lime-400"
                          : event.type === "yellow_card"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                      }
                    >
                      {event.type === "goal"
                        ? "But"
                        : event.type === "yellow_card"
                        ? "Carton jaune"
                        : "Carton rouge"}
                    </Badge>
                    <span>{event.player}</span>
                    <span className="text-gray-500">({event.team})</span>
                  </div>
                )
              )}
            </div>
          </Card>
        )}

        {/* Statistiques */}
        {match.status === "FT" && match.stats && (
          <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
            <h3 className="text-lg font-bold text-lime-400 mb-4">Statistiques</h3>
            <Separator className="bg-gray-800 mb-4" />
            <div className="space-y-4">
              {Object.entries(match.stats as Record<string, { home: number; away: number }>).map(
                ([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{value.home}</span>
                      <span className="text-gray-400 capitalize">
                        {key.replace(/_/g, " ")}
                      </span>
                      <span>{value.away}</span>
                    </div>
                    <div className="flex gap-1 h-2">
                      <div
                        className="bg-lime-400 rounded-l"
                        style={{
                          width: `${(value.home / (value.home + value.away)) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-gray-600 rounded-r"
                        style={{
                          width: `${(value.away / (value.home + value.away)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </Card>
        )}

        {/* Article lie */}
        {relatedArticle && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-lime-400 mb-4">Article lie</h3>
            <ArticleCard
              slug={relatedArticle.slug}
              title={relatedArticle.title}
              excerpt={relatedArticle.excerpt || ""}
              type={relatedArticle.type}
              publishedAt={relatedArticle.published_at}
            />
          </div>
        )}

        <div className="mt-8">
          <AffiliateButton bookmakerName="1xBet" affiliateUrl="https://reffpa.com/L?tag=d_689933m_1573c_bonus&site=689933&ad=1573" bonus="Bonus de bienvenue jusqu'à 200 000 FCFA" />
        </div>
      </div>
    </main>
  );
}
