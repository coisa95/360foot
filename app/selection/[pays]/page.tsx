import { createClient } from "@/lib/supabase";
import { Breadcrumb } from "@/components/breadcrumb";
import { MatchCard } from "@/components/match-card";
import { Card } from "@/components/ui/card";
import { AffiliateBanner } from "@/components/affiliate-banner";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 300;

const countryMap: Record<string, { name: string; fullName: string; flag: string }> = {
  CI: { name: "Cote d'Ivoire", fullName: "Equipe nationale de Cote d'Ivoire", flag: "🇨🇮" },
  SN: { name: "Senegal", fullName: "Equipe nationale du Senegal", flag: "🇸🇳" },
  CM: { name: "Cameroun", fullName: "Equipe nationale du Cameroun", flag: "🇨🇲" },
  ML: { name: "Mali", fullName: "Equipe nationale du Mali", flag: "🇲🇱" },
  BF: { name: "Burkina Faso", fullName: "Equipe nationale du Burkina Faso", flag: "🇧🇫" },
};

type Props = {
  params: Promise<{ pays: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pays } = await params;
  const country = countryMap[pays.toUpperCase()];

  if (!country) return { title: "Selection introuvable - 360 Foot" };

  const title = `${country.fullName} - Matchs et actualites - 360 Foot`;
  const description = `Suivez l'${country.fullName} : derniers matchs, resultats, compositions et toute l'actualite de la selection.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://360-foot.com/selection/${pays}`,
    },
  };
}

export default async function NationalTeamPage({ params }: Props) {
  const { pays } = await params;
  const countryCode = pays.toUpperCase();
  const country = countryMap[countryCode];

  if (!country) notFound();

  const supabase = createClient();

  // Chercher l'equipe nationale par pays
  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("country_code", countryCode)
    .eq("is_national", true)
    .single();

  let recentMatches = null;
  if (team) {
    const { data: matches } = await supabase
      .from("matches")
      .select("*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), league:leagues!league_id(*)")
      .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
      .order("date", { ascending: false })
      .limit(10);
    recentMatches = matches;
  }

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Selections", href: "/selection" },
    { label: country.name },
  ];

  return (
    <main className="min-h-screen bg-dark-bg text-white">
      <div className="container mx-auto px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-lime-400">
            {country.flag} {country.fullName}
          </h1>
          <p className="text-gray-400 mt-1">
            Tous les matchs et resultats de la selection {country.name.toLowerCase()}
          </p>
        </div>

        {/* Informations equipe */}
        {team && (
          <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Pays</p>
                <p className="font-medium">{country.name}</p>
              </div>
              {team.coach && (
                <div>
                  <p className="text-gray-400 text-sm">Selectionneur</p>
                  <p className="font-medium">{team.coach}</p>
                </div>
              )}
              {team.venue && (
                <div>
                  <p className="text-gray-400 text-sm">Stade</p>
                  <p className="font-medium">{team.venue}</p>
                </div>
              )}
              {team.fifa_ranking && (
                <div>
                  <p className="text-gray-400 text-sm">Classement FIFA</p>
                  <p className="font-medium text-lime-400 text-xl">{team.fifa_ranking}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        <AffiliateBanner bookmakerName="1xBet" affiliateUrl="https://reffpa.com/L?tag=d_689933m_1573c_bonus&site=689933&ad=1573" bonus="Bonus de bienvenue jusqu'à 200 000 FCFA" />

        {/* Derniers matchs */}
        {recentMatches && recentMatches.length > 0 ? (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Derniers matchs</h2>
            <div className="space-y-3">
              {recentMatches.map((match: Record<string, unknown>) => {
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
          </div>
        ) : (
          <Card className="bg-dark-bg border-gray-800 p-8 mt-6 text-center">
            <p className="text-gray-400">
              Aucun match recent disponible pour la selection {country.name.toLowerCase()}.
            </p>
          </Card>
        )}
      </div>
    </main>
  );
}
