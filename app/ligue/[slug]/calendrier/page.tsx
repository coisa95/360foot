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

  if (!league) return { title: "Calendrier introuvable" };

  const title = `Calendrier ${league.name} - Prochains matchs`;
  const fullDesc = `Calendrier et prochains matchs de ${league.name}.`;
  const description = fullDesc.length > 155 ? fullDesc.slice(0, 152) + "..." : fullDesc;

  return {
    title,
    description,
    alternates: { canonical: `https://360-foot.com/ligue/${slug}/calendrier` },
    openGraph: { title, description, type: "website", url: `https://360-foot.com/ligue/${slug}/calendrier`, images: [`/api/og?title=${encodeURIComponent(title)}`] },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
    },
  };
}

export default async function LeagueFixturesPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createClient();

  const { data: league } = await supabase
    .from("leagues")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!league) notFound();

  const now = new Date().toISOString();
  const { data: matches } = await supabase
    .from("matches")
    .select("*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)")
    .eq("league_id", league.id)
    .eq("status", "NS")
    .gte("date", now)
    .order("date", { ascending: true })
    .limit(50);

  // Group by date
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Accueil", item: "https://360-foot.com" },
              { "@type": "ListItem", position: 2, name: league.name, item: `https://360-foot.com/ligue/${slug}` },
              { "@type": "ListItem", position: 3, name: "Calendrier" },
            ],
          }),
        }}
      />
      {grouped.size > 0 ? (
        <div className="space-y-4">
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
                    homeScore={null}
                    awayScore={null}
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
        <p className="text-center text-gray-500 py-12">Aucun match à venir.</p>
      )}

      <AffiliateTrio />
    </>
  );
}
