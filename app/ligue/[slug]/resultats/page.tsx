import { createAnonClient } from "@/lib/supabase";
import { safeJsonLd } from "@/lib/json-ld";
import { getCspNonce } from "@/lib/csp-nonce";
import { noindexIf } from "@/lib/seo-helpers";
import { MatchCard } from "@/components/match-card";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { RoundNav } from "@/components/round-nav";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ journee?: string }>;
};

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAnonClient();

  const { data: league } = await supabase
    .from("leagues")
    .select("id, name")
    .eq("slug", slug)
    .single();

  if (!league) return { title: "Résultats introuvables" };

  // Thin content : une page résultats doit afficher des matchs récents —
  // on exige au moins 1 match joué dans les 90 derniers jours. Au-delà,
  // la ligue est probablement en intersaison ou la data est trop vieille.
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("matches")
    .select("id", { count: "exact", head: true })
    .eq("league_id", league.id)
    .not("score_home", "is", null)
    .gte("date", cutoff);
  const hasData = (count ?? 0) > 0;

  const season = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
  const title = `Résultats ${league.name} ${season}`;
  const fullDesc = `Tous les scores et résultats ${league.name} ${season}, journée par journée. Mis à jour après chaque match.`;
  const description = fullDesc.length > 155 ? fullDesc.slice(0, 152) + "..." : fullDesc;

  return {
    title,
    description,
    robots: noindexIf(!hasData),
    alternates: { canonical: `https://360-foot.com/ligue/${slug}/resultats` },
    openGraph: { title, description, type: "website", url: `https://360-foot.com/ligue/${slug}/resultats`, locale: "fr_FR", images: [`https://360-foot.com/api/og?title=${encodeURIComponent(title)}`] },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [`https://360-foot.com/api/og?title=${encodeURIComponent(title)}`],
    },
  };
}

// Extract round number for sorting
function extractRoundNumber(round: string): number {
  const match = round.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

// Clean round name for display
function cleanRoundName(round: string): string {
  const num = round.match(/(\d+)/);
  if (num && round.toLowerCase().includes("regular")) {
    return `Journée ${num[1]}`;
  }
  if (round.toLowerCase().includes("semi")) return "Demi-finales";
  if (round.toLowerCase().includes("quarter")) return "Quarts de finale";
  if (round.toLowerCase().includes("round of 16") || round.toLowerCase().includes("8th")) return "Huitièmes de finale";
  if (round.toLowerCase().includes("final") && !round.toLowerCase().includes("semi") && !round.toLowerCase().includes("quarter")) return "Finale";
  if (round.toLowerCase().includes("3rd place")) return "Match pour la 3e place";
  if (num) return `Journée ${num[1]}`;
  return round;
}

export default async function LeagueResultsPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { journee } = await searchParams;
  const supabase = createAnonClient();

  const { data: league } = await supabase
    .from("leagues")
    .select("id,name,slug")
    .eq("slug", slug)
    .single();

  if (!league) {
    // Opt out of ISR cache for 404 — otherwise Next.js caches the
    // not-found response with HTTP 200, not 404.
    headers();
    notFound();
  }

  const { data: allMatches } = await supabase
    .from("matches")
    .select("id,slug,date,score_home,score_away,status,stats_json,home_team:teams!home_team_id(name,slug),away_team:teams!away_team_id(name,slug)")
    .eq("league_id", league.id)
    .in("status", ["FT", "AET", "PEN"])
    .order("date", { ascending: false })
    .limit(500);

  // Extract rounds
  const roundsSet = new Set<string>();
  const matchesByRound = new Map<string, any[]>();

  for (const match of allMatches || []) {
    const round = (match.stats_json as any)?.league?.round || "Inconnu";
    roundsSet.add(round);
    if (!matchesByRound.has(round)) matchesByRound.set(round, []);
    matchesByRound.get(round)!.push(match);
  }

  const sortedRounds = Array.from(roundsSet).sort((a, b) => extractRoundNumber(b) - extractRoundNumber(a));

  // Determine active round
  let activeRound = journee
    ? sortedRounds.find((r) => cleanRoundName(r) === `Journée ${journee}` || r === journee) || sortedRounds[0]
    : sortedRounds[0]; // Most recent round by default

  if (!activeRound && sortedRounds.length > 0) {
    activeRound = sortedRounds[0];
  }

  const displayMatches = activeRound ? (matchesByRound.get(activeRound) || []) : (allMatches || []);

  // Group by date
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

  // For RoundNav, sort ascending for display
  const navRounds = Array.from(roundsSet).sort((a, b) => extractRoundNumber(a) - extractRoundNumber(b));

  return (
    <>
      <script
        type="application/ld+json"
        nonce={getCspNonce()}
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Accueil", item: "https://360-foot.com" },
              { "@type": "ListItem", position: 2, name: "Compétitions", item: "https://360-foot.com/competitions" },
              { "@type": "ListItem", position: 3, name: league.name, item: `https://360-foot.com/ligue/${slug}` },
              { "@type": "ListItem", position: 4, name: "Résultats" },
            ],
          }),
        }}
      />

      {/* Round navigation — horizontal scroll with auto-center */}
      {navRounds.length > 1 && (
        <RoundNav
          rounds={navRounds.map((round) => ({
            raw: round,
            label: cleanRoundName(round),
            num: extractRoundNumber(round),
            param: extractRoundNumber(round) > 0 ? String(extractRoundNumber(round)) : round,
          }))}
          activeRound={activeRound || ""}
          slug={slug}
          basePath="resultats"
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
          <p className="text-sm text-slate-400">Aucun résultat disponible pour le moment.</p>
        </div>
      )}

      <AffiliateTrio />
    </>
  );
}
