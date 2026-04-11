import { createClient } from "@/lib/supabase";
import { safeJsonLd } from "@/lib/json-ld";
import { MatchCard } from "@/components/match-card";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { RoundNav } from "@/components/round-nav";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 900;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ journee?: string }>;
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

  const title = `Calendrier ${league.name} - Tous les matchs par journée`;
  const fullDesc = `Calendrier complet de ${league.name} : résultats et matchs à venir, journée par journée.`;
  const description = fullDesc.length > 155 ? fullDesc.slice(0, 152) + "..." : fullDesc;

  return {
    title,
    description,
    alternates: { canonical: `https://360-foot.com/ligue/${slug}/calendrier` },
    openGraph: { title, description, type: "website", url: `https://360-foot.com/ligue/${slug}/calendrier`, locale: "fr_FR", images: [`https://360-foot.com/api/og?title=${encodeURIComponent(title)}`] },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [`https://360-foot.com/api/og?title=${encodeURIComponent(title)}`],
    },
  };
}

// Extract round number for sorting: "Regular Season - 15" → 15
function extractRoundNumber(round: string): number {
  const match = round.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

// Clean round name for display: "Regular Season - 15" → "Journée 15"
function cleanRoundName(round: string): string {
  const num = round.match(/(\d+)/);
  if (num && round.toLowerCase().includes("regular")) {
    return `Journée ${num[1]}`;
  }
  // Group stages, knockouts etc
  if (round.toLowerCase().includes("semi")) return "Demi-finales";
  if (round.toLowerCase().includes("quarter")) return "Quarts de finale";
  if (round.toLowerCase().includes("round of 16") || round.toLowerCase().includes("8th")) return "Huitièmes de finale";
  if (round.toLowerCase().includes("final") && !round.toLowerCase().includes("semi") && !round.toLowerCase().includes("quarter")) return "Finale";
  if (round.toLowerCase().includes("3rd place")) return "Match pour la 3e place";
  if (num) return `Journée ${num[1]}`;
  return round;
}

export default async function LeagueFixturesPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { journee } = await searchParams;
  const supabase = createClient();

  const { data: league } = await supabase
    .from("leagues")
    .select("id,name,slug")
    .eq("slug", slug)
    .single();

  if (!league) notFound();

  // Fetch ALL matches for this league (results + upcoming)
  const { data: allMatches } = await supabase
    .from("matches")
    .select("id,slug,date,score_home,score_away,status,stats_json,home_team:teams!home_team_id(name,slug),away_team:teams!away_team_id(name,slug)")
    .eq("league_id", league.id)
    .order("date", { ascending: true })
    .limit(500);

  // Extract rounds from stats_json.league.round
  const roundsSet = new Set<string>();
  const matchesByRound = new Map<string, any[]>();

  for (const match of allMatches || []) {
    const round = (match.stats_json as any)?.league?.round || "Inconnu";
    roundsSet.add(round);
    if (!matchesByRound.has(round)) matchesByRound.set(round, []);
    matchesByRound.get(round)!.push(match);
  }

  // Sort rounds by number
  const sortedRounds = Array.from(roundsSet).sort((a, b) => extractRoundNumber(a) - extractRoundNumber(b));

  // Determine which round to show
  let activeRound = journee
    ? sortedRounds.find((r) => cleanRoundName(r) === `Journée ${journee}` || r === journee) || sortedRounds[0]
    : null;

  // If no journee param, find the current/next round (closest to today)
  if (!activeRound && sortedRounds.length > 0) {
    const now = new Date();
    for (const round of sortedRounds) {
      const roundMatches = matchesByRound.get(round) || [];
      const hasUpcoming = roundMatches.some((m: any) => new Date(m.date) >= now || m.status === "NS");
      if (hasUpcoming) {
        activeRound = round;
        break;
      }
    }
    if (!activeRound) activeRound = sortedRounds[sortedRounds.length - 1];
  }

  const displayMatches = activeRound ? (matchesByRound.get(activeRound) || []) : (allMatches || []);

  // Group display matches by date
  const grouped = new Map<string, any[]>();
  for (const match of displayMatches) {
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
          __html: safeJsonLd({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Accueil", item: "https://360-foot.com" },
              { "@type": "ListItem", position: 2, name: "Compétitions", item: "https://360-foot.com/competitions" },
              { "@type": "ListItem", position: 3, name: league.name, item: `https://360-foot.com/ligue/${slug}` },
              { "@type": "ListItem", position: 4, name: "Calendrier" },
            ],
          }),
        }}
      />

      {/* Round navigation — horizontal scroll with auto-center */}
      {sortedRounds.length > 1 && (
        <RoundNav
          rounds={sortedRounds.map((round) => ({
            raw: round,
            label: cleanRoundName(round),
            num: extractRoundNumber(round),
            param: extractRoundNumber(round) > 0 ? String(extractRoundNumber(round)) : round,
          }))}
          activeRound={activeRound || ""}
          slug={slug}
        />
      )}

      {/* Active round title */}
      {activeRound && (
        <h2 className="font-display text-sm font-bold text-slate-900 mb-3">
          {cleanRoundName(activeRound)}
        </h2>
      )}

      {grouped.size > 0 ? (
        <div className="space-y-3">
          {Array.from(grouped.entries()).map(([dateLabel, dateMatches]) => (
            <div key={dateLabel}>
              <p className="text-xs text-slate-400 mb-2 font-medium">{dateLabel}</p>
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
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm text-slate-400">Aucun match disponible pour cette journée.</p>
        </div>
      )}

      <AffiliateTrio />
    </>
  );
}
