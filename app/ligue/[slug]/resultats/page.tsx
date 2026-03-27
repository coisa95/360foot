import { createClient } from "@/lib/supabase";
import { MatchCard } from "@/components/match-card";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { Metadata } from "next";
import { notFound } from "next/navigation";

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

  if (!league) return { title: "Résultats introuvables" };

  const title = `Résultats ${league.name} - Tous les scores`;
  const description = `Tous les résultats et scores des matchs de ${league.name}.`;

  return {
    title,
    description,
    alternates: { canonical: `https://360-foot.com/ligue/${slug}/resultats` },
    openGraph: { title, description, type: "website", url: `https://360-foot.com/ligue/${slug}/resultats` },
  };
}

export default async function LeagueResultsPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createClient();

  const { data: league } = await supabase
    .from("leagues")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!league) notFound();

  const { data: matches } = await supabase
    .from("matches")
    .select("*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)")
    .eq("league_id", league.id)
    .in("status", ["FT", "AET", "PEN"])
    .order("date", { ascending: false })
    .limit(50);

  // Group matches by date
  const grouped = new Map<string, any[]>();
  for (const match of matches || []) {
    const dateKey = new Date(match.date).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!grouped.has(dateKey)) grouped.set(dateKey, []);
    grouped.get(dateKey)!.push(match);
  }

  return (
    <>
      {grouped.size > 0 ? (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([dateLabel, dateMatches]) => (
            <div key={dateLabel}>
              <h3 className="text-sm font-semibold text-gray-400 mb-2 capitalize">{dateLabel}</h3>
              <div className="space-y-2">
                {dateMatches.map((match: any) => (
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
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-12">Aucun résultat disponible.</p>
      )}

      <AffiliateTrio />
    </>
  );
}
