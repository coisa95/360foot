import { createAnonClient } from "@/lib/supabase";
import { Breadcrumb } from "@/components/breadcrumb";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { MatchLeagueGroup } from "@/components/match-league-group";
import { LeagueFilter } from "@/components/league-filter";
import { Metadata } from "next";
import Link from "next/link";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Matchs du jour — Scores en direct et résultats",
  description:
    "Scores en direct, résultats et matchs à venir aujourd'hui. Football africain et européen : Ligue 1 Côte d'Ivoire, Sénégal, Cameroun, Premier League.",
  alternates: { canonical: "https://360-foot.com/matchs" },
  openGraph: {
    title: "Matchs en direct et résultats — 360 Foot",
    description: "Scores en direct, résultats et matchs à venir du football africain et européen.",
    type: "website",
    url: "https://360-foot.com/matchs",
    locale: "fr_FR",
    images: ["https://360-foot.com/api/og?title=Matchs%20en%20direct"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Matchs en direct et résultats — 360 Foot",
    description: "Scores en direct, résultats et matchs à venir du football africain et européen.",
    images: ["https://360-foot.com/api/og?title=Matchs%20en%20direct"],
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
  const supabase = createAnonClient();

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
    .select("name, slug, logo_url")
    .order("name")
    .limit(100);

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
    <main className="min-h-screen text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        <h1 className="font-display sr-only">Matchs de football du jour</h1>

        {/* Date navigation */}
        <div className="mt-4 flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
          {dateDays.map((d) => {
            const ds = formatDateParam(d);
            const isActive = ds === selectedDateStr;
            return (
              <Link
                key={ds}
                rel="nofollow"
                href={buildHref(ds, ligue)}
                className={`shrink-0 rounded-lg px-3 py-2 text-center text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-emerald-500 text-black"
                    : "bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900"
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

        {/* League filter — collapsible */}
        <LeagueFilter
          leagues={leagues || []}
          selectedDateStr={selectedDateStr}
          currentLigue={ligue}
          todayDateStr={formatDateParam(today)}
        />

        {/* Matches grouped by league — collapsible */}
        {matchesByLeague.size > 0 ? (
          <div className="mt-6 space-y-3">
            {Array.from(matchesByLeague.values()).map((group) => (
              <MatchLeagueGroup
                key={group.leagueSlug}
                leagueName={group.leagueName}
                leagueSlug={group.leagueSlug}
                leagueLogo={group.leagueLogo}
                matches={group.matches}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-400">Aucun match pour cette date.</p>
          </div>
        )}

        <div className="mt-12">
          <AffiliateTrio />
        </div>
      </div>
    </main>
  );
}
