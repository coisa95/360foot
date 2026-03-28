import { createClient } from "@/lib/supabase";
import { Breadcrumb } from "@/components/breadcrumb";
import { ArticleCard } from "@/components/article-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 600;

type Props = {
  params: Promise<{ slug: string }>;
};

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createClient();

  const { data: match } = await supabase
    .from("matches")
    .select("*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), league:leagues!league_id(*)")
    .eq("slug", slug)
    .single();

  if (!match) return { title: "Match introuvable - 360 Foot" };

  const homeName = match.home_team?.name || "Équipe A";
  const awayName = match.away_team?.name || "Équipe B";
  const leagueName = match.league?.name || "";

  const title =
    match.status === "FT"
      ? `${homeName} ${match.score_home}-${match.score_away} ${awayName} — ${leagueName}`
      : `${homeName} vs ${awayName} — ${leagueName}`;

  const rawDesc =
    match.status === "FT"
      ? `Score final : ${homeName} ${match.score_home} - ${match.score_away} ${awayName}. ${leagueName}. Résumé, buteurs, stats et compositions.`
      : `Avant-match ${homeName} vs ${awayName} en ${leagueName}. Pronostics, compositions probables et analyse.`;
  const description = rawDesc.length > 155 ? rawDesc.slice(0, 152) + "..." : rawDesc;

  return {
    title,
    description,
    alternates: { canonical: `https://360-foot.com/match/${slug}` },
    openGraph: { title, description, type: "website", url: `https://360-foot.com/match/${slug}`, images: [`/api/og?title=${encodeURIComponent(title)}`] },
    twitter: { card: "summary_large_image", title, description },
  };
}

// ── Helpers ──

function getStatLabel(key: string): string {
  const labels: Record<string, string> = {
    "Ball Possession": "Possession",
    "Total Shots": "Tirs totaux",
    "Shots on Goal": "Tirs cadrés",
    "Shots off Goal": "Tirs non cadrés",
    "Blocked Shots": "Tirs bloqués",
    "Corner Kicks": "Corners",
    "Offsides": "Hors-jeu",
    "Fouls": "Fautes",
    "Yellow Cards": "Cartons jaunes",
    "Red Cards": "Cartons rouges",
    "Total passes": "Passes totales",
    "Passes accurate": "Passes réussies",
    "Passes %": "Précision passes",
    "Goalkeeper Saves": "Arrêts du gardien",
    "expected_goals": "xG",
  };
  return labels[key] || key.replace(/_/g, " ");
}

function getEventIcon(type: string, detail: string): string {
  if (type === "Goal" && detail === "Penalty") return "⚽️ (P)";
  if (type === "Goal" && detail === "Own Goal") return "⚽️ (CSC)";
  if (type === "Goal") return "⚽️";
  if (type === "Card" && detail === "Yellow Card") return "🟨";
  if (type === "Card" && detail === "Red Card") return "🟥";
  if (type === "Card" && detail === "Second Yellow card") return "🟨🟥";
  if (type === "subst") return "🔄";
  if (type === "Var") return "📺 VAR";
  return "•";
}

function parseStatValue(val: any): number {
  if (val === null || val === undefined) return 0;
  const str = String(val).replace("%", "");
  return parseInt(str) || 0;
}

// ── Main Component ──

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

  const homeName = match.home_team?.name || "Équipe A";
  const awayName = match.away_team?.name || "Équipe B";
  const homeSlug = match.home_team?.slug || "";
  const awaySlug = match.away_team?.slug || "";
  const leagueName = match.league?.name || "";
  const leagueSlug = match.league?.slug || "";

  // Extract data from JSON columns
  const statsJson = match.stats_json as any;
  const eventsJson = match.events_json as any[] | null;
  const lineupsJson = match.lineups_json as any[] | null;
  const playersJson = match.players_json as any[] | null;
  const predictionsJson = match.predictions_json as any | null;
  const h2hJson = match.h2h_json as any[] | null;
  const injuriesJson = match.injuries_json as any[] | null;

  // Match info
  const referee = statsJson?.fixture?.referee || statsJson?.matchInfo?.referee || null;
  const venue = statsJson?.fixture?.venue?.name || statsJson?.matchInfo?.venue || null;
  const city = statsJson?.fixture?.venue?.city || statsJson?.matchInfo?.city || null;
  const halftime = statsJson?.score?.halftime || null;

  // Statistics
  const statistics = statsJson?.statistics as Record<string, { home: any; away: any }> | null;

  // Build player name → slug lookup map
  const playerNames = new Set<string>();
  if (eventsJson) {
    for (const e of eventsJson) {
      if (e.player) playerNames.add(e.player);
      if (e.assist) playerNames.add(e.assist);
    }
  }
  if (lineupsJson) {
    for (const lineup of lineupsJson) {
      for (const p of [...(lineup.startXI || []), ...(lineup.substitutes || [])]) {
        if (p.name) playerNames.add(p.name);
      }
    }
  }
  if (injuriesJson) {
    for (const inj of injuriesJson) {
      if (inj.player) playerNames.add(inj.player);
    }
  }
  if (playersJson) {
    for (const team of playersJson) {
      for (const p of team.players || []) {
        if (p.name) playerNames.add(p.name);
      }
    }
  }

  const playerSlugMap: Record<string, string> = {};
  if (playerNames.size > 0) {
    // Batch lookup: search by last name fragments for better matching
    const nameArray = Array.from(playerNames);
    const { data: matchedPlayers } = await supabase
      .from("players")
      .select("name, slug")
      .in("name", nameArray);

    if (matchedPlayers) {
      for (const p of matchedPlayers) {
        playerSlugMap[p.name] = p.slug;
      }
    }

    // Try partial matching for unmatched names (last name match)
    const unmatched = nameArray.filter((n) => !playerSlugMap[n]);
    if (unmatched.length > 0 && unmatched.length <= 50) {
      for (const name of unmatched) {
        const lastName = name.split(" ").pop() || name;
        if (lastName.length < 3) continue;
        const { data: found } = await supabase
          .from("players")
          .select("name, slug")
          .ilike("name", `%${lastName}%`)
          .limit(1)
          .maybeSingle();
        if (found) playerSlugMap[name] = found.slug;
      }
    }
  }

  // Helper to render player name as link or plain text
  const PlayerLink = ({ name, className }: { name: string; className?: string }) => {
    const slug = playerSlugMap[name];
    if (slug) {
      return <Link href={`/joueur/${slug}`} className={`hover:text-lime-400 transition-colors ${className || ""}`}>{name}</Link>;
    }
    return <span className={className}>{name}</span>;
  };

  // Helper to render team name as link
  const TeamLink = ({ name, className }: { name: string; className?: string }) => {
    let slug = "";
    if (name === homeName) slug = homeSlug;
    else if (name === awayName) slug = awaySlug;
    if (slug) {
      return <Link href={`/equipe/${slug}`} className={`hover:text-lime-400 transition-colors ${className || ""}`}>{name}</Link>;
    }
    return <span className={className}>{name}</span>;
  };

  const PRIORITY_STATS = [
    "Ball Possession", "Total Shots", "Shots on Goal", "Shots off Goal",
    "Corner Kicks", "Offsides", "Fouls", "Yellow Cards", "Red Cards",
    "Goalkeeper Saves", "Passes accurate", "Passes %", "Total passes",
  ];

  const isFinished = match.status === "FT";
  const isLive = ["1H", "2H", "HT", "ET", "P", "BT"].includes(match.status);
  const isUpcoming = match.status === "NS";

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Compétitions", href: "/competitions" },
    ...(leagueName ? [{ label: leagueName, href: `/ligue/${leagueSlug}` }] : []),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${homeName} vs ${awayName}`,
    startDate: match.date,
    location: { "@type": "Place", name: venue || "Stade" },
    homeTeam: { "@type": "SportsTeam", name: homeName },
    awayTeam: { "@type": "SportsTeam", name: awayName },
    competitor: [
      { "@type": "SportsTeam", name: homeName },
      { "@type": "SportsTeam", name: awayName },
    ],
  };

  return (
    <main className="min-h-screen bg-dark-bg text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container mx-auto max-w-4xl px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        {/* ── Score Header ── */}
        <Card className="mt-6 overflow-hidden border-gray-800 bg-gradient-to-b from-dark-card to-dark-bg">
          <div className="p-6 text-center">
            <Badge className="bg-lime-500/20 text-lime-400 border-lime-500/30">
              {leagueName}
            </Badge>
            <p className="mt-2 text-xs text-gray-500">
              {new Date(match.date).toLocaleDateString("fr-FR", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
              {" à "}
              {new Date(match.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </p>
            {venue && (
              <p className="mt-1 text-xs text-gray-600">{venue}{city ? `, ${city}` : ""}</p>
            )}
            {referee && (
              <p className="mt-1 text-xs text-gray-600">Arbitre : {referee}</p>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 px-4 pb-8 sm:gap-8">
            {/* Home team */}
            <div className="flex-1 text-center">
              {match.home_team?.logo_url && (
                <Image src={match.home_team.logo_url} alt={`Logo ${homeName}`} width={80} height={80} className="mx-auto mb-2 h-16 w-16 object-contain sm:h-20 sm:w-20" />
              )}
              <h2 className="text-sm font-bold sm:text-lg">{homeSlug ? <Link href={`/equipe/${homeSlug}`} className="hover:text-lime-400 transition-colors">{homeName}</Link> : homeName}</h2>
            </div>

            {/* Score */}
            <div className="text-center">
              {isFinished || isLive ? (
                <>
                  <div className="text-4xl font-bold text-lime-400 sm:text-5xl">
                    {match.score_home} - {match.score_away}
                  </div>
                  {halftime && halftime.home !== null && (
                    <p className="mt-1 text-xs text-gray-500">
                      MT : {halftime.home} - {halftime.away}
                    </p>
                  )}
                  <Badge className={`mt-2 ${isLive ? "bg-green-500/20 text-green-400 border-green-500/30 animate-pulse" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
                    {isLive ? "En cours" : "Terminé"}
                  </Badge>
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-gray-400">VS</div>
                  <Badge className="mt-2 bg-blue-500/20 text-blue-400 border-blue-500/30">
                    À venir
                  </Badge>
                </>
              )}
            </div>

            {/* Away team */}
            <div className="flex-1 text-center">
              {match.away_team?.logo_url && (
                <Image src={match.away_team.logo_url} alt={`Logo ${awayName}`} width={80} height={80} className="mx-auto mb-2 h-16 w-16 object-contain sm:h-20 sm:w-20" />
              )}
              <h2 className="text-sm font-bold sm:text-lg">{awaySlug ? <Link href={`/equipe/${awaySlug}`} className="hover:text-lime-400 transition-colors">{awayName}</Link> : awayName}</h2>
            </div>
          </div>
        </Card>

        {/* ── Predictions (Upcoming matches only) ── */}
        {isUpcoming && predictionsJson && (
          <Card className="mt-4 border-gray-800 bg-dark-card p-4 sm:p-6">
            <h3 className="mb-4 text-lg font-bold text-lime-400">🔮 Pronostic</h3>

            {/* Advice */}
            {predictionsJson.advice && (
              <div className="mb-4 rounded-lg bg-dark-bg p-3 text-center">
                <p className="text-sm font-medium text-white">{predictionsJson.advice}</p>
              </div>
            )}

            {/* Win probability */}
            {predictionsJson.percent && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">{homeName}</span>
                  <span className="text-gray-400">Nul</span>
                  <span className="font-medium">{awayName}</span>
                </div>
                <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
                  <div
                    className="bg-lime-400 rounded-l-full transition-all flex items-center justify-center"
                    style={{ width: predictionsJson.percent.home || "33%" }}
                  >
                    <span className="text-[10px] font-bold text-black">{predictionsJson.percent.home}</span>
                  </div>
                  <div
                    className="bg-gray-500 transition-all flex items-center justify-center"
                    style={{ width: predictionsJson.percent.draw || "33%" }}
                  >
                    <span className="text-[10px] font-bold text-white">{predictionsJson.percent.draw}</span>
                  </div>
                  <div
                    className="bg-blue-400 rounded-r-full transition-all flex items-center justify-center"
                    style={{ width: predictionsJson.percent.away || "33%" }}
                  >
                    <span className="text-[10px] font-bold text-black">{predictionsJson.percent.away}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            {(predictionsJson.home_form || predictionsJson.away_form) && (
              <div className="grid grid-cols-2 gap-4 mt-3">
                {predictionsJson.home_form && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Forme {homeName}</p>
                    <div className="flex gap-1">
                      {predictionsJson.home_form.split("").map((r: string, i: number) => (
                        <span key={i} className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${
                          r === "W" ? "bg-green-500/20 text-green-400" :
                          r === "D" ? "bg-gray-500/20 text-gray-400" :
                          "bg-red-500/20 text-red-400"
                        }`}>
                          {r === "W" ? "V" : r === "D" ? "N" : "D"}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {predictionsJson.away_form && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Forme {awayName}</p>
                    <div className="flex gap-1">
                      {predictionsJson.away_form.split("").map((r: string, i: number) => (
                        <span key={i} className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${
                          r === "W" ? "bg-green-500/20 text-green-400" :
                          r === "D" ? "bg-gray-500/20 text-gray-400" :
                          "bg-red-500/20 text-red-400"
                        }`}>
                          {r === "W" ? "V" : r === "D" ? "N" : "D"}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Comparison */}
            {predictionsJson.comparison && Object.keys(predictionsJson.comparison).length > 0 && (
              <div className="mt-4 space-y-2">
                <Separator className="bg-gray-800" />
                <p className="text-xs text-gray-500 font-medium mt-2">Comparaison</p>
                {Object.entries(predictionsJson.comparison).map(([key, val]: [string, any]) => {
                  const homePercent = parseInt(val.home) || 50;
                  const compLabels: Record<string, string> = {
                    "Form": "Forme", "Att": "Attaque", "Def": "Défense",
                    "Poisson Distribution": "Distribution", "H2H": "Confrontations",
                    "Goals": "Buts", "Total": "Global",
                  };
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span>{val.home}</span>
                        <span className="text-gray-500">{compLabels[key] || key}</span>
                        <span>{val.away}</span>
                      </div>
                      <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full">
                        <div className="bg-lime-400 rounded-l-full" style={{ width: `${homePercent}%` }} />
                        <div className="bg-blue-400 rounded-r-full" style={{ width: `${100 - homePercent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* ── Head to Head ── */}
        {h2hJson && h2hJson.length > 0 && (
          <Card className="mt-4 border-gray-800 bg-dark-card p-4 sm:p-6">
            <h3 className="mb-4 text-lg font-bold text-lime-400">⚔️ Confrontations directes</h3>
            <div className="space-y-2">
              {h2hJson.map((h2h: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between rounded-lg bg-dark-bg px-3 py-2 text-sm">
                  <span className="text-xs text-gray-500 w-20">
                    {new Date(h2h.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <span className={`flex-1 text-right ${h2h.homeScore > h2h.awayScore ? "text-white font-medium" : "text-gray-400"}`}>
                    {h2h.homeTeam}
                  </span>
                  <span className="mx-3 font-bold text-lime-400">
                    {h2h.homeScore} - {h2h.awayScore}
                  </span>
                  <span className={`flex-1 ${h2h.awayScore > h2h.homeScore ? "text-white font-medium" : "text-gray-400"}`}>
                    {h2h.awayTeam}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── Injuries ── */}
        {injuriesJson && injuriesJson.length > 0 && (
          <Card className="mt-4 border-gray-800 bg-dark-card p-4 sm:p-6">
            <h3 className="mb-4 text-lg font-bold text-lime-400">🏥 Absents et blessés</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Home team injuries */}
              <div>
                <p className="text-sm font-medium text-white mb-2">{homeName}</p>
                <div className="space-y-1">
                  {injuriesJson
                    .filter((inj: any) => inj.team === homeName)
                    .map((inj: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <span className="text-red-400">✕</span>
                        <span className="flex-1 text-gray-300"><PlayerLink name={inj.player} className="text-gray-300" /></span>
                        <span className="text-xs text-gray-500">{inj.reason}</span>
                      </div>
                    ))}
                  {injuriesJson.filter((inj: any) => inj.team === homeName).length === 0 && (
                    <p className="text-xs text-gray-500">Aucun absent signalé</p>
                  )}
                </div>
              </div>
              {/* Away team injuries */}
              <div>
                <p className="text-sm font-medium text-white mb-2">{awayName}</p>
                <div className="space-y-1">
                  {injuriesJson
                    .filter((inj: any) => inj.team === awayName)
                    .map((inj: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <span className="text-red-400">✕</span>
                        <span className="flex-1 text-gray-300"><PlayerLink name={inj.player} className="text-gray-300" /></span>
                        <span className="text-xs text-gray-500">{inj.reason}</span>
                      </div>
                    ))}
                  {injuriesJson.filter((inj: any) => inj.team === awayName).length === 0 && (
                    <p className="text-xs text-gray-500">Aucun absent signalé</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* ── Events (Goals, Cards, Subs) ── */}
        {isFinished && (
          eventsJson && eventsJson.length > 0 ? (
            <Card className="mt-4 border-gray-800 bg-dark-card p-4 sm:p-6">
              <h3 className="mb-4 text-lg font-bold text-lime-400">Événements du match</h3>
              <div className="space-y-2">
                {eventsJson
                  .filter((e: any) => e.type !== "subst")
                  .map((event: any, index: number) => {
                    const isHome = event.team === homeName;
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                          isHome ? "bg-dark-bg" : "bg-dark-surface"
                        }`}
                      >
                        <span className="w-10 text-center font-mono text-xs text-lime-400">
                          {event.minute}&apos;{event.extra ? `+${event.extra}` : ""}
                        </span>
                        <span className="text-base">{getEventIcon(event.type, event.detail || "")}</span>
                        <span className="flex-1 font-medium">
                          <PlayerLink name={event.player} />
                          {event.assist && (
                            <span className="ml-1 text-xs text-gray-500">(pass. <PlayerLink name={event.assist} className="text-gray-500" />)</span>
                          )}
                        </span>
                        <TeamLink name={event.team} className="text-xs text-gray-500" />
                      </div>
                    );
                  })}
              </div>
            </Card>
          ) : (
            <div className="mt-4 rounded-lg border border-dark-border/50 bg-dark-card/50 p-8 text-center">
              <p className="text-sm text-gray-500">Données non disponibles pour les événements.</p>
            </div>
          )
        )}

        {/* ── Statistics ── */}
        {isFinished && (
          statistics && Object.keys(statistics).length > 0 ? (
            <Card className="mt-4 border-gray-800 bg-dark-card p-4 sm:p-6">
              <h3 className="mb-4 text-lg font-bold text-lime-400">Statistiques</h3>
              <div className="space-y-4">
                {PRIORITY_STATS.filter((key) => statistics[key]).map((key) => {
                  const stat = statistics[key];
                  const homeVal = parseStatValue(stat.home);
                  const awayVal = parseStatValue(stat.away);
                  const total = homeVal + awayVal || 1;
                  const homePercent = (homeVal / total) * 100;
                  const isPossession = key === "Ball Possession";

                  return (
                    <div key={key}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium">{isPossession ? `${stat.home}` : homeVal}</span>
                        <span className="text-gray-400">{getStatLabel(key)}</span>
                        <span className="font-medium">{isPossession ? `${stat.away}` : awayVal}</span>
                      </div>
                      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
                        <div
                          className="rounded-l-full bg-lime-400 transition-all"
                          style={{ width: `${homePercent}%` }}
                        />
                        <div
                          className="rounded-r-full bg-gray-600 transition-all"
                          style={{ width: `${100 - homePercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : (
            <div className="mt-4 rounded-lg border border-dark-border/50 bg-dark-card/50 p-8 text-center">
              <p className="text-sm text-gray-500">Données non disponibles pour les statistiques.</p>
            </div>
          )
        )}

        {/* ── Lineups ── */}
        {isFinished && (
          lineupsJson && lineupsJson.length >= 2 ? (
            <Card className="mt-4 border-gray-800 bg-dark-card p-4 sm:p-6">
              <h3 className="mb-4 text-lg font-bold text-lime-400">Compositions</h3>
              <div className="grid gap-6 sm:grid-cols-2">
                {lineupsJson.map((lineup: any, idx: number) => (
                  <div key={idx}>
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="font-bold text-white"><TeamLink name={lineup.team} /></h4>
                      {lineup.formation && (
                        <Badge className="bg-dark-surface text-gray-400 border-gray-700">
                          {lineup.formation}
                        </Badge>
                      )}
                    </div>
                    {lineup.coach && (
                      <p className="mb-2 text-xs text-gray-500">Coach : {lineup.coach}</p>
                    )}
                    <div className="space-y-1">
                      {(lineup.startXI || []).map((p: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="w-6 text-center text-xs font-mono text-gray-500">
                            {p.number || "-"}
                          </span>
                          <span className="flex-1"><PlayerLink name={p.name} /></span>
                          <span className="text-[10px] text-gray-600 uppercase">{p.pos}</span>
                        </div>
                      ))}
                    </div>
                    {(lineup.substitutes || []).length > 0 && (
                      <>
                        <Separator className="my-2 bg-gray-800" />
                        <p className="mb-1 text-xs text-gray-500">Remplaçants</p>
                        <div className="space-y-1">
                          {(lineup.substitutes || []).slice(0, 7).map((p: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                              <span className="w-6 text-center font-mono">{p.number || "-"}</span>
                              <span className="flex-1"><PlayerLink name={p.name} className="text-gray-400" /></span>
                              <span className="text-[10px] text-gray-600 uppercase">{p.pos}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <div className="mt-4 rounded-lg border border-dark-border/50 bg-dark-card/50 p-8 text-center">
              <p className="text-sm text-gray-500">Données non disponibles pour les compositions.</p>
            </div>
          )
        )}

        {/* ── Player Ratings ── */}
        {isFinished && playersJson && playersJson.length > 0 && (
          <Card className="mt-4 border-gray-800 bg-dark-card p-4 sm:p-6">
            <h3 className="mb-4 text-lg font-bold text-lime-400">⭐ Notes des joueurs</h3>
            <div className="grid gap-6 sm:grid-cols-2">
              {playersJson.map((team: any, idx: number) => {
                const sortedPlayers = [...(team.players || [])]
                  .filter((p: any) => p.rating)
                  .sort((a: any, b: any) => parseFloat(b.rating) - parseFloat(a.rating));

                if (sortedPlayers.length === 0) return null;

                const posLabel = (pos: string) => {
                  const map: Record<string, string> = { G: "G", D: "D", M: "M", F: "A" };
                  return map[pos] || pos;
                };

                const ratingColor = (rating: string) => {
                  const val = parseFloat(rating);
                  if (val >= 7.0) return "bg-green-500/20 text-green-400 border-green-500/30";
                  if (val >= 6.0) return "bg-gray-500/20 text-gray-400 border-gray-500/30";
                  return "bg-red-500/20 text-red-400 border-red-500/30";
                };

                return (
                  <div key={idx}>
                    <h4 className="mb-3 font-bold text-white"><TeamLink name={team.team} /></h4>
                    <div className="space-y-1.5">
                      {sortedPlayers.map((p: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 rounded-lg bg-dark-bg px-3 py-1.5 text-sm">
                          <span className="w-6 text-center text-xs font-mono text-gray-500">
                            {p.number || "-"}
                          </span>
                          <span className="flex-1 truncate">
                            <PlayerLink name={p.name} />
                          </span>
                          {p.stats?.goals > 0 && (
                            <span className="text-xs" title={`${p.stats.goals} but(s)`}>
                              {"⚽".repeat(Math.min(p.stats.goals, 3))}
                            </span>
                          )}
                          {p.stats?.assists > 0 && (
                            <span className="text-xs" title={`${p.stats.assists} passe(s) dé.`}>
                              {"🅰️".repeat(Math.min(p.stats.assists, 3))}
                            </span>
                          )}
                          <Badge className={`text-[10px] px-1.5 py-0 border ${
                            p.position === "G" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                            p.position === "D" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                            p.position === "M" ? "bg-purple-500/20 text-purple-400 border-purple-500/30" :
                            "bg-red-500/20 text-red-400 border-red-500/30"
                          }`}>
                            {posLabel(p.position)}
                          </Badge>
                          <Badge className={`text-xs font-bold px-2 py-0 border ${ratingColor(p.rating)}`}>
                            {parseFloat(p.rating).toFixed(1)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ── Related article ── */}
        {relatedArticle && (
          <div className="mt-6">
            <h3 className="mb-3 text-lg font-bold text-lime-400">Article lié</h3>
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
          <AffiliateTrio />
        </div>
      </div>
    </main>
  );
}
