import { createClient } from "@/lib/supabase";
import { Breadcrumb } from "@/components/breadcrumb";
import { Card } from "@/components/ui/card";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
};

interface StandingEntry {
  rank: number;
  team_name: string;
  team_logo: string;
  team_api_id: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  group: string;
  form: string;
}

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

  // Standings are stored as JSON in data_json column
  const { data: standingsRows } = await supabase
    .from("standings")
    .select("data_json, season, updated_at")
    .eq("league_id", league.id)
    .order("updated_at", { ascending: false })
    .limit(1);

  const standings: StandingEntry[] = standingsRows?.[0]?.data_json || [];
  const season = standingsRows?.[0]?.season || "";
  const updatedAt = standingsRows?.[0]?.updated_at;

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
          <p className="text-gray-400 mt-1">
            {league.country} - Saison {season}
            {updatedAt && (
              <span className="text-gray-600 ml-2">
                · Mis à jour le{" "}
                {new Date(updatedAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </p>
        </div>

        {standings.length > 0 ? (
          <Card className="bg-dark-bg border-gray-800 mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="text-left p-3 w-8">#</th>
                  <th className="text-left p-3">Équipe</th>
                  <th className="text-center p-3">MJ</th>
                  <th className="text-center p-3">V</th>
                  <th className="text-center p-3">N</th>
                  <th className="text-center p-3">D</th>
                  <th className="text-center p-3">BP</th>
                  <th className="text-center p-3">BC</th>
                  <th className="text-center p-3">Diff</th>
                  <th className="text-center p-3 font-bold text-lime-400">Pts</th>
                  <th className="text-center p-3 hidden md:table-cell">Forme</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row, index) => (
                  <tr
                    key={`${row.team_api_id}-${row.rank}`}
                    className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${
                      index < 3 ? "border-l-2 border-l-lime-400" : ""
                    } ${
                      index >= standings.length - 3
                        ? "border-l-2 border-l-red-500"
                        : ""
                    }`}
                  >
                    <td className="p-3 text-gray-400 font-mono">{row.rank}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {row.team_logo && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.team_logo}
                            alt={row.team_name}
                            className="w-5 h-5 object-contain"
                          />
                        )}
                        <span className="font-medium">{row.team_name}</span>
                      </div>
                    </td>
                    <td className="text-center p-3">{row.played}</td>
                    <td className="text-center p-3 text-green-400">{row.won}</td>
                    <td className="text-center p-3 text-gray-400">{row.drawn}</td>
                    <td className="text-center p-3 text-red-400">{row.lost}</td>
                    <td className="text-center p-3">{row.goals_for}</td>
                    <td className="text-center p-3">{row.goals_against}</td>
                    <td className="text-center p-3">
                      <span
                        className={
                          row.goal_diff > 0
                            ? "text-green-400"
                            : row.goal_diff < 0
                            ? "text-red-400"
                            : "text-gray-400"
                        }
                      >
                        {row.goal_diff > 0 ? "+" : ""}
                        {row.goal_diff}
                      </span>
                    </td>
                    <td className="text-center p-3 font-bold text-lime-400">
                      {row.points}
                    </td>
                    <td className="text-center p-3 hidden md:table-cell">
                      <div className="flex justify-center gap-0.5">
                        {row.form &&
                          row.form
                            .split("")
                            .slice(-5)
                            .map((r, i) => (
                              <span
                                key={i}
                                className={`inline-block w-5 h-5 rounded text-xs font-bold flex items-center justify-center ${
                                  r === "W"
                                    ? "bg-green-600 text-white"
                                    : r === "D"
                                    ? "bg-gray-600 text-white"
                                    : r === "L"
                                    ? "bg-red-600 text-white"
                                    : "bg-gray-700 text-gray-400"
                                }`}
                              >
                                {r === "W" ? "V" : r === "D" ? "N" : r === "L" ? "D" : "-"}
                              </span>
                            ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <Card className="bg-dark-bg border-gray-800 p-8 mt-6 text-center">
            <p className="text-gray-400">
              Aucun classement disponible pour cette ligue.
            </p>
          </Card>
        )}

        <AffiliateTrio />
      </div>
    </main>
  );
}
