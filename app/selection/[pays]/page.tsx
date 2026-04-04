import { createClient } from "@/lib/supabase";
import { safeJsonLd } from "@/lib/json-ld";
import { Breadcrumb } from "@/components/breadcrumb";
import { MatchCard } from "@/components/match-card";
import { Card } from "@/components/ui/card";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 900;

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
  const fullDesc = `Suivez l'${country.fullName} : derniers matchs, resultats, compositions et toute l'actualite de la selection.`;
  const description = fullDesc.length > 155 ? fullDesc.slice(0, 152) + "..." : fullDesc;

  return {
    title,
    description,
    alternates: {
      canonical: `https://360-foot.com/selection/${pays}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://360-foot.com/selection/${pays}`,
      locale: "fr_FR",
      images: [`https://360-foot.com/api/og?title=${encodeURIComponent(title)}`],
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [`https://360-foot.com/api/og?title=${encodeURIComponent(title)}`],
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
    .select("id,name,slug,coach,venue,fifa_ranking,country_code,is_national")
    .eq("country_code", countryCode)
    .eq("is_national", true)
    .single();

  let recentMatches = null;
  if (team) {
    const { data: matches } = await supabase
      .from("matches")
      .select("id,slug,date,score_home,score_away,status,home_team:teams!home_team_id(name,slug),away_team:teams!away_team_id(name,slug),league:leagues!league_id(name)")
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
    <main className="min-h-screen text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            "@context": "https://schema.org",
            "@type": "SportsTeam",
            name: country.fullName,
            sport: "Football",
            url: `https://360-foot.com/selection/${pays}`,
            location: {
              "@type": "Country",
              name: country.name,
            },
          }),
        }}
      />
      <div className="container mx-auto px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        <div className="mt-6">
          <h1 className="font-display text-3xl font-bold text-emerald-400">
            {country.flag} {country.fullName}
          </h1>
          <p className="text-gray-400 mt-1">
            Tous les matchs et resultats de la selection {country.name.toLowerCase()}
          </p>
        </div>

        {/* Informations equipe */}
        {team && (
          <Card className="bg-transparent border-gray-800 p-6 mt-6">
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
                  <p className="font-medium text-emerald-400 text-xl">{team.fifa_ranking}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        <AffiliateTrio />

        {/* Derniers matchs */}
        {recentMatches && recentMatches.length > 0 ? (
          <div className="mt-8">
            <h2 className="font-display text-xl font-bold mb-4">Derniers matchs</h2>
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
          <Card className="bg-transparent border-gray-800 p-8 mt-6 text-center">
            <p className="text-gray-400">
              Aucun match recent disponible pour la selection {country.name.toLowerCase()}.
            </p>
          </Card>
        )}
      </div>
    </main>
  );
}
