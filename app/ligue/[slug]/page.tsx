import { createClient } from "@/lib/supabase";
import { safeJsonLd } from "@/lib/json-ld";
import { Card } from "@/components/ui/card";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 900;

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
    .select("name")
    .eq("slug", slug)
    .single();

  if (!league) return { title: "Classement introuvable" };

  const season = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
  const title = `Classement ${league.name} ${season}`;
  const fullDesc = `Classement ${league.name} ${season} : points, victoires, forme et différence de buts. Mis à jour après chaque journée.`;
  const description = fullDesc.length > 155 ? fullDesc.slice(0, 152) + "..." : fullDesc;

  return {
    title,
    description,
    alternates: { canonical: `https://360-foot.com/ligue/${slug}` },
    openGraph: { title, description, type: "website", url: `https://360-foot.com/ligue/${slug}`, locale: "fr_FR", images: [`https://360-foot.com/api/og?title=${encodeURIComponent(title)}`] },
    twitter: { card: "summary_large_image" as const, title, description, images: [`https://360-foot.com/api/og?title=${encodeURIComponent(title)}`] },
  };
}

export default async function LeagueStandingsPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createClient();

  const { data: league } = await supabase
    .from("leagues")
    .select("id,name,slug,country,country_code,logo_url")
    .eq("slug", slug)
    .single();

  if (!league) notFound();

  const { data: standingsRows } = await supabase
    .from("standings")
    .select("data_json, season, updated_at")
    .eq("league_id", league.id)
    .order("updated_at", { ascending: false })
    .limit(1);

  const standings: StandingEntry[] = standingsRows?.[0]?.data_json || [];
  const season = standingsRows?.[0]?.season || "";
  const updatedAt = standingsRows?.[0]?.updated_at;

  // Group standings by group field
  const groupsMap = new Map<string, StandingEntry[]>();
  for (const row of standings) {
    const groupKey = row.group || "";
    if (!groupsMap.has(groupKey)) groupsMap.set(groupKey, []);
    groupsMap.get(groupKey)!.push(row);
  }
  const groups = Array.from(groupsMap.entries());
  const hasMultipleGroups = groups.length > 1;

  function cleanGroupName(raw: string): string {
    const match = raw.match(/(Groupe\s+\w+)/i);
    return match ? match[1].trim() : raw.trim();
  }

  // Get team slugs for linking
  const teamApiIds = standings.map((s) => s.team_api_id).filter(Boolean);
  const { data: teams } = await supabase
    .from("teams")
    .select("api_football_id, slug")
    .in("api_football_id", teamApiIds);

  const teamSlugMap = new Map<number, string>();
  for (const t of teams || []) {
    if (t.api_football_id && t.slug) teamSlugMap.set(t.api_football_id, t.slug);
  }

  const jsonLdOrg: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    name: league.name,
    sport: "Football",
    url: `https://360-foot.com/ligue/${slug}`,
    description: `Classement complet de la ${league.name} : points, victoires, défaites, nuls, buts marqués et encaissés.`,
  };
  if (league.logo_url) {
    jsonLdOrg.logo = league.logo_url;
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Accueil", item: "https://360-foot.com" },
              { "@type": "ListItem", position: 2, name: "Compétitions", item: "https://360-foot.com/competitions" },
              { "@type": "ListItem", position: 3, name: league.name },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdOrg) }}
      />
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-400">
          Saison {season}
          {updatedAt && (
            <span className="ml-2">
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
        <div className={hasMultipleGroups ? "space-y-6" : ""}>
          {groups.map(([groupName, groupStandings]) => (
            <div key={groupName}>
              {hasMultipleGroups && (
                <h2 className="font-display text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 bg-emerald-500 rounded-full" />
                  {cleanGroupName(groupName)}
                </h2>
              )}
              <Card className="bg-transparent border-slate-200 overflow-x-auto">
                <table className="w-full text-xs sm:text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="text-left p-1.5 sm:p-3 w-6 sm:w-8 sticky left-0 bg-transparent z-10">#</th>
                      <th className="text-left p-1.5 sm:p-3 sticky left-6 sm:left-8 bg-transparent z-10 min-w-[120px]">Équipe</th>
                      <th className="text-center p-1.5 sm:p-3">MJ</th>
                      <th className="text-center p-1.5 sm:p-3 font-bold text-emerald-600">Pts</th>
                      <th className="text-center p-1.5 sm:p-3">Diff</th>
                      <th className="text-center p-1.5 sm:p-3">V</th>
                      <th className="text-center p-1.5 sm:p-3">N</th>
                      <th className="text-center p-1.5 sm:p-3">D</th>
                      <th className="text-center p-1.5 sm:p-3">BP</th>
                      <th className="text-center p-1.5 sm:p-3">BC</th>
                      <th className="text-center p-1.5 sm:p-3">Forme</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupStandings.map((row, index) => {
                      const teamSlug = teamSlugMap.get(row.team_api_id);
                      return (
                        <tr
                          key={`${row.team_api_id}-${row.rank}`}
                          className={`border-b border-slate-200 hover:bg-slate-100 transition-colors ${
                            index < 3 ? "border-l-2 border-l-emerald-500" : ""
                          } ${
                            index >= groupStandings.length - 3 ? "border-l-2 border-l-red-500" : ""
                          }`}
                        >
                          <td className="p-1.5 sm:p-3 text-slate-500 font-mono sticky left-0 bg-transparent z-10">{row.rank}</td>
                          <td className="p-1.5 sm:p-3 sticky left-6 sm:left-8 bg-transparent z-10">
                            <div className="flex items-center gap-1.5">
                              {row.team_logo && (
                                <Image src={row.team_logo} alt={`Logo ${row.team_name}`} width={20} height={20} className="w-4 h-4 sm:w-5 sm:h-5 object-contain shrink-0" />
                              )}
                              {teamSlug ? (
                                <Link href={`/equipe/${teamSlug}`} className="font-medium hover:text-emerald-600 transition-colors truncate">
                                  {row.team_name}
                                </Link>
                              ) : (
                                <span className="font-medium truncate">{row.team_name}</span>
                              )}
                            </div>
                          </td>
                          <td className="text-center p-1.5 sm:p-3">{row.played}</td>
                          <td className="text-center p-1.5 sm:p-3 font-bold text-emerald-600">{row.points}</td>
                          <td className="text-center p-1.5 sm:p-3">
                            <span className={row.goal_diff > 0 ? "text-green-600" : row.goal_diff < 0 ? "text-red-600" : "text-slate-500"}>
                              {row.goal_diff > 0 ? "+" : ""}{row.goal_diff}
                            </span>
                          </td>
                          <td className="text-center p-1.5 sm:p-3 text-green-600">{row.won}</td>
                          <td className="text-center p-1.5 sm:p-3 text-slate-500">{row.drawn}</td>
                          <td className="text-center p-1.5 sm:p-3 text-red-600">{row.lost}</td>
                          <td className="text-center p-1.5 sm:p-3">{row.goals_for}</td>
                          <td className="text-center p-1.5 sm:p-3">{row.goals_against}</td>
                          <td className="text-center p-1.5 sm:p-3">
                            <div className="flex justify-center gap-0.5">
                              {row.form && row.form.split("").slice(-5).map((r, i) => (
                                <span
                                  key={i}
                                  className={`inline-flex w-4 h-4 sm:w-5 sm:h-5 rounded text-[10px] sm:text-xs font-bold items-center justify-center ${
                                    r === "W" ? "bg-green-600 text-white" :
                                    r === "D" ? "bg-slate-300 text-slate-600" :
                                    r === "L" ? "bg-red-600 text-white" :
                                    "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  {r === "W" ? "V" : r === "D" ? "N" : r === "L" ? "D" : "-"}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <Card className="bg-transparent border-slate-200 p-8 text-center">
          <p className="text-slate-500">Aucun classement disponible pour cette ligue.</p>
        </Card>
      )}

      <AffiliateTrio />
    </>
  );
}
