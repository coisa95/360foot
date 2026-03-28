import { createClient } from "@/lib/supabase";
import { Breadcrumb } from "@/components/breadcrumb";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Matchs en direct et résultats — Football africain et européen — 360 Foot",
  description:
    "Tous les matchs de football en direct, résultats et calendrier. Ligue 1 Côte d'Ivoire, Sénégal, Cameroun, Premier League, Champions League.",
  alternates: { canonical: "https://360-foot.com/matchs" },
  openGraph: {
    title: "Matchs en direct et résultats — 360 Foot",
    description: "Scores en direct, résultats et matchs à venir du football africain et européen.",
    type: "website",
    url: "https://360-foot.com/matchs",
    images: ["/api/og?title=Matchs%20en%20direct"],
  },
};

type Props = {
  searchParams: Promise<{ date?: string; ligue?: string }>;
};

/* eslint-disable @typescript-eslint/no-explicit-any */

function formatDateParam(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatDateLabel(d: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return "Aujourd'hui";
  if (diff === -1) return "Hier";
  if (diff === 1) return "Demain";
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

export default async function MatchsPage({ searchParams }: Props) {
  const { date: dateParam, ligue } = await searchParams;
  const supabase = createClient();

  // Determine selected date
  const today = new Date();
  const selectedDate = dateParam ? new Date(dateParam + "T00:00:00") : today;
  const selectedDateStr = formatDateParam(selectedDate);

  // Date range: from start of selected day to end of selected day
  const dayStart = `${selectedDateStr}T00:00:00.000Z`;
  const dayEnd = `${selectedDateStr}T23:59:59.999Z`;

  // Build date navigation: 3 days before, today, 3 days after
  const dateDays: Date[] = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dateDays.push(d);
  }

  // Fetch matches for selected date
  let matchesQuery = supabase
    .from("matches")
    .select(
      `slug, date, status, score_home, score_away,
       home_team:teams!home_team_id(name, slug, logo_url),
       away_team:teams!away_team_id(name, slug, logo_url),
       league:leagues!league_id(id, name, slug, logo_url)`
    )
    .gte("date", dayStart)
    .lte("date", dayEnd)
    .order("date", { ascending: true })
    .limit(200);

  if (ligue) {
    const { data: leagueData } = await supabase
      .from("leagues")
      .select("id")
      .eq("slug", ligue)
      .single();

    if (leagueData) {
      matchesQuery = matchesQuery.eq("league_id", leagueData.id);
    }
  }

  const { data: matches } = await matchesQuery;

  // Fetch leagues for filter
  const { data: leagues } = await supabase
    .from("leagues")
    .select("name, slug")
    .order("name");

  // Group matches by league
  const matchesByLeague = new Map<string, { leagueName: string; leagueSlug: string; leagueLogo: string | null; matches: any[] }>();
  for (const match of (matches || []) as any[]) {
    const league = match.league;
    const key = league?.slug || "other";
    if (!matchesByLeague.has(key)) {
      matchesByLeague.set(key, {
        leagueName: league?.name || "Autre",
        leagueSlug: league?.slug || "",
        leagueLogo: league?.logo_url || null,
        matches: [],
      });
    }
    matchesByLeague.get(key)!.matches.push(match);
  }

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Matchs" },
  ];

  const buildHref = (dateStr: string, ligueSlug?: string) => {
    const params = new URLSearchParams();
    if (dateStr !== formatDateParam(today)) params.set("date", dateStr);
    if (ligueSlug) params.set("ligue", ligueSlug);
    const qs = params.toString();
    return `/matchs${qs ? `?${qs}` : ""}`;
  };

  return (
    <main className="min-h-screen bg-dark-bg text-white">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        <h1 className="mt-6 text-3xl font-bold md:text-4xl">
          <span className="text-lime-400">Matchs</span> du jour
        </h1>

        {/* Date navigation */}
        <div className="mt-4 flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
          {dateDays.map((d) => {
            const ds = formatDateParam(d);
            const isActive = ds === selectedDateStr;
            return (
              <Link
                key={ds}
                href={buildHref(ds, ligue)}
                className={`shrink-0 rounded-lg px-3 py-2 text-center text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-lime-400 text-black"
                    : "bg-dark-card text-gray-400 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <div className="font-bold">{formatDateLabel(d)}</div>
                <div className="text-[10px] opacity-70">
                  {d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </div>
              </Link>
            );
          })}
        </div>

        {/* League filter */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          <Link
            href={buildHref(selectedDateStr)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              !ligue
                ? "bg-lime-500 text-black"
                : "bg-dark-card text-gray-400 hover:bg-dark-surface hover:text-white"
            }`}
          >
            Toutes
          </Link>
          {(leagues || []).map((l: any) => (
            <Link
              key={l.slug}
              href={buildHref(selectedDateStr, l.slug)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                ligue === l.slug
                  ? "bg-lime-500 text-black"
                  : "bg-dark-card text-gray-400 hover:bg-dark-surface hover:text-white"
              }`}
            >
              {l.name}
            </Link>
          ))}
        </div>

        {/* Matches grouped by league */}
        {matchesByLeague.size > 0 ? (
          <div className="mt-6 space-y-4">
            {Array.from(matchesByLeague.values()).map((group) => (
              <Card key={group.leagueSlug} className="border-gray-800 bg-dark-card overflow-hidden">
                {/* League header */}
                <Link
                  href={`/ligue/${group.leagueSlug}`}
                  className="flex items-center gap-2 px-4 py-2.5 bg-dark-bg/50 border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                >
                  {group.leagueLogo && (
                    <Image src={group.leagueLogo} alt="" width={16} height={16} className="h-4 w-4 object-contain" />
                  )}
                  <span className="text-xs font-semibold text-gray-300">{group.leagueName}</span>
                </Link>

                {/* Match rows */}
                <div className="divide-y divide-gray-800/50">
                  {group.matches.map((match: any) => {
                    const homeTeam = match.home_team;
                    const awayTeam = match.away_team;
                    const isFinished = ["FT", "AET", "PEN"].includes(match.status);
                    const isLive = ["1H", "2H", "HT", "ET", "P", "BT"].includes(match.status);
                    const isUpcoming = match.status === "NS";
                    const matchTime = new Date(match.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

                    return (
                      <Link
                        key={match.slug}
                        href={`/match/${match.slug}`}
                        className="flex items-center px-4 py-2.5 hover:bg-gray-800/30 transition-colors"
                      >
                        {/* Time / Status */}
                        <div className="w-14 shrink-0 text-center">
                          {isUpcoming && (
                            <span className="text-xs font-bold text-blue-400">{matchTime}</span>
                          )}
                          {isLive && (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] animate-pulse">
                              EN COURS
                            </Badge>
                          )}
                          {isFinished && (
                            <span className="text-[10px] font-semibold text-emerald-400">
                              {match.status === "AET" ? "A.P." : match.status === "PEN" ? "T.A.B." : "Terminé"}
                            </span>
                          )}
                          {!isUpcoming && !isLive && !isFinished && (
                            <span className="text-[10px] text-gray-500">{match.status}</span>
                          )}
                        </div>

                        {/* Teams */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {homeTeam?.logo_url && (
                                <Image src={homeTeam.logo_url} alt="" width={18} height={18} className="h-4.5 w-4.5 object-contain shrink-0" />
                              )}
                              <span className={`text-xs sm:text-sm truncate ${isFinished && (match.score_home ?? 0) > (match.score_away ?? 0) ? "font-bold text-white" : "text-gray-300"}`}>
                                {homeTeam?.name || "Équipe A"}
                              </span>
                            </div>
                            {!isUpcoming && (
                              <span className={`text-sm font-bold tabular-nums shrink-0 ${isFinished && (match.score_home ?? 0) > (match.score_away ?? 0) ? "text-white" : "text-gray-400"}`}>
                                {match.score_home ?? 0}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {awayTeam?.logo_url && (
                                <Image src={awayTeam.logo_url} alt="" width={18} height={18} className="h-4.5 w-4.5 object-contain shrink-0" />
                              )}
                              <span className={`text-xs sm:text-sm truncate ${isFinished && (match.score_away ?? 0) > (match.score_home ?? 0) ? "font-bold text-white" : "text-gray-300"}`}>
                                {awayTeam?.name || "Équipe B"}
                              </span>
                            </div>
                            {!isUpcoming && (
                              <span className={`text-sm font-bold tabular-nums shrink-0 ${isFinished && (match.score_away ?? 0) > (match.score_home ?? 0) ? "text-white" : "text-gray-400"}`}>
                                {match.score_away ?? 0}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-dark-border/50 bg-dark-card/50 p-8 text-center">
            <p className="text-sm text-gray-500">Aucun match pour cette date.</p>
          </div>
        )}

        <div className="mt-12">
          <AffiliateTrio />
        </div>
      </div>
    </main>
  );
}
