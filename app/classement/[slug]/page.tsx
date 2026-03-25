import { createClient } from "@/lib/supabase";
import { Breadcrumb } from "@/components/breadcrumb";
import { Card } from "@/components/ui/card";
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

  if (!league) return { title: "Classement introuvable - 360 Foot" };

  const title = `Classement ${league.name} - Tableau complet - 360 Foot`;
  const description = `Classement complet de la ${league.name} : points, victoires, defaites, nuls, buts marques et encaisses, difference de buts.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://360-foot.com/classement/${slug}`,
    },
  };
}

export default async function StandingsPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createClient();

  const { data: league } = await supabase
    .from("leagues")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!league) notFound();

  const { data: standings } = await supabase
    .from("standings")
    .select("*, team:teams!team_id(*)")
    .eq("league_id", league.id)
    .order("position", { ascending: true });

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: league.name, href: `/ligue/${league.slug}` },
    { label: "Classement" },
  ];

  return (
    <main className="min-h-screen bg-dark-bg text-white">
      <div className="container mx-auto px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-lime-400">
            Classement {league.name}
          </h1>
          {league.country && (
            <p className="text-gray-400 mt-1">{league.country} - Saison en cours</p>
          )}
        </div>

        {/* Tableau complet */}
        {standings && standings.length > 0 ? (
          <Card className="bg-dark-bg border-gray-800 mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="text-left p-3 w-8">#</th>
                  <th className="text-left p-3">Equipe</th>
                  <th className="text-center p-3">MJ</th>
                  <th className="text-center p-3">V</th>
                  <th className="text-center p-3">N</th>
                  <th className="text-center p-3">D</th>
                  <th className="text-center p-3">BP</th>
                  <th className="text-center p-3">BC</th>
                  <th className="text-center p-3">Diff</th>
                  <th className="text-center p-3 font-bold text-lime-400">Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row, index) => (
                  <tr
                    key={row.team.id}
                    className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${
                      index < 3 ? "border-l-2 border-l-lime-400" : ""
                    }`}
                  >
                    <td className="p-3 text-gray-400 font-mono">{row.position}</td>
                    <td className="p-3">
                      <a
                        href={`/equipe/${row.team.slug}`}
                        className="hover:text-lime-400 transition-colors font-medium"
                      >
                        {row.team.name}
                      </a>
                    </td>
                    <td className="text-center p-3">{row.played}</td>
                    <td className="text-center p-3 text-green-400">{row.won}</td>
                    <td className="text-center p-3 text-gray-400">{row.drawn}</td>
                    <td className="text-center p-3 text-red-400">{row.lost}</td>
                    <td className="text-center p-3">{row.goals_for}</td>
                    <td className="text-center p-3">{row.goals_against}</td>
                    <td className="text-center p-3">
                      {row.goals_for - row.goals_against > 0 ? "+" : ""}
                      {row.goals_for - row.goals_against}
                    </td>
                    <td className="text-center p-3 font-bold text-lime-400">{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <Card className="bg-dark-bg border-gray-800 p-8 mt-6 text-center">
            <p className="text-gray-400">Aucun classement disponible pour cette ligue.</p>
          </Card>
        )}

        <AffiliateBanner bookmakerName="1xBet" affiliateUrl="https://reffpa.com/L?tag=d_689933m_1573c_bonus&site=689933&ad=1573" bonus="Bonus de bienvenue jusqu'à 200 000 FCFA" />
      </div>
    </main>
  );
}
