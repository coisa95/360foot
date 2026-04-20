import { createAnonClient } from "@/lib/supabase";
import { safeJsonLd } from "@/lib/json-ld";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

export const revalidate = 3600;

type Props = {
  params: Promise<{ slug: string }>;
};

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Helpers ──

function parseSlug(slug: string): { slugA: string; slugB: string } | null {
  const idx = slug.indexOf("-vs-");
  if (idx <= 0 || idx + 4 >= slug.length) return null;
  return { slugA: slug.slice(0, idx), slugB: slug.slice(idx + 4) };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function countryToFlag(country: string | null): string {
  if (!country) return "";
  const flags: Record<string, string> = {
    France: "\uD83C\uDDEB\uD83C\uDDF7",
    Spain: "\uD83C\uDDEA\uD83C\uDDF8",
    England: "\uD83C\uDDEC\uD83C\uDDE7",
    Germany: "\uD83C\uDDE9\uD83C\uDDEA",
    Italy: "\uD83C\uDDEE\uD83C\uDDF9",
    Portugal: "\uD83C\uDDF5\uD83C\uDDF9",
    Netherlands: "\uD83C\uDDF3\uD83C\uDDF1",
    Belgium: "\uD83C\uDDE7\uD83C\uDDEA",
    Brazil: "\uD83C\uDDE7\uD83C\uDDF7",
    Argentina: "\uD83C\uDDE6\uD83C\uDDF7",
    Morocco: "\uD83C\uDDF2\uD83C\uDDE6",
    Senegal: "\uD83C\uDDF8\uD83C\uDDF3",
    "Ivory Coast": "\uD83C\uDDE8\uD83C\uDDEE",
    "Cote D'Ivoire": "\uD83C\uDDE8\uD83C\uDDEE",
    Cameroon: "\uD83C\uDDE8\uD83C\uDDF2",
    Nigeria: "\uD83C\uDDF3\uD83C\uDDEC",
    Ghana: "\uD83C\uDDEC\uD83C\uDDED",
    Egypt: "\uD83C\uDDEA\uD83C\uDDEC",
    Tunisia: "\uD83C\uDDF9\uD83C\uDDF3",
    Algeria: "\uD83C\uDDE9\uD83C\uDDFF",
    Mali: "\uD83C\uDDF2\uD83C\uDDF1",
    "Burkina Faso": "\uD83C\uDDE7\uD83C\uDDEB",
    Guinea: "\uD83C\uDDEC\uD83C\uDDF3",
    "DR Congo": "\uD83C\uDDE8\uD83C\uDDE9",
    "South Africa": "\uD83C\uDDFF\uD83C\uDDE6",
    Turkey: "\uD83C\uDDF9\uD83C\uDDF7",
    Scotland: "\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74\uDB40\uDC7F",
    USA: "\uD83C\uDDFA\uD83C\uDDF8",
    Mexico: "\uD83C\uDDF2\uD83C\uDDFD",
    Japan: "\uD83C\uDDEF\uD83C\uDDF5",
    "Saudi-Arabia": "\uD83C\uDDF8\uD83C\uDDE6",
    Qatar: "\uD83C\uDDF6\uD83C\uDDE6",
  };
  return flags[country] || "";
}

// ── Metadata ──

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseSlug(slug);
  if (!parsed) {
    // Opt out of ISR cache for 404 — otherwise Next.js caches the
    // not-found response with HTTP 200, not 404.
    headers();
    notFound();
  }

  const { slugA, slugB } = parsed;
  const supabase = createAnonClient();

  const [{ data: teamA }, { data: teamB }] = await Promise.all([
    supabase.from("teams").select("id, name, slug").eq("slug", slugA).single(),
    supabase.from("teams").select("id, name, slug").eq("slug", slugB).single(),
  ]);

  if (!teamA || !teamB) {
    // Opt out of ISR cache for 404 — otherwise Next.js caches the
    // not-found response with HTTP 200, not 404.
    headers();
    notFound();
  }

  const title = `${teamA.name} vs ${teamB.name} — Confrontations directes`;
  const fullDesc = `${teamA.name} vs ${teamB.name} : historique complet, bilan victoires/nuls/défaites, scores et stats de toutes les rencontres.`;
  const description = fullDesc.length > 155 ? fullDesc.slice(0, 152) + "..." : fullDesc;

  // Check if there are matches to decide noindex
  const { count } = await supabase
    .from("matches")
    .select("id", { count: "exact", head: true })
    .not("score_home", "is", null)
    .or(
      `and(home_team_id.eq.${teamA.id},away_team_id.eq.${teamB.id}),and(home_team_id.eq.${teamB.id},away_team_id.eq.${teamA.id})`
    );

  const robots = count && count > 0 ? undefined : { index: false, follow: true };

  return {
    title,
    description,
    robots,
    alternates: { canonical: `https://360-foot.com/confrontation/${slugA}-vs-${slugB}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://360-foot.com/confrontation/${slugA}-vs-${slugB}`,
      locale: "fr_FR",
      images: [`https://360-foot.com/api/og?title=${encodeURIComponent(title)}`],
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [`https://360-foot.com/api/og?title=${encodeURIComponent(title)}`],
    },
  };
}

// ── Main Component ──

export default async function ConfrontationPage({ params }: Props) {
  const { slug } = await params;
  const parsed = parseSlug(slug);
  if (!parsed) {
    // Opt out of ISR cache for 404 — otherwise Next.js caches the
    // not-found response with HTTP 200, not 404.
    headers();
    notFound();
  }

  const { slugA, slugB } = parsed;
  const supabase = createAnonClient();

  // Fetch both teams
  const [{ data: teamA }, { data: teamB }] = await Promise.all([
    supabase.from("teams").select("id, name, slug, logo_url, country").eq("slug", slugA).single(),
    supabase.from("teams").select("id, name, slug, logo_url, country").eq("slug", slugB).single(),
  ]);

  if (!teamA || !teamB) {
    // Opt out of ISR cache for 404 — otherwise Next.js caches the
    // not-found response with HTTP 200, not 404.
    headers();
    notFound();
  }

  // Fetch all H2H matches (both directions)
  const { data: matches } = await supabase
    .from("matches")
    .select(
      "*, home_team:teams!home_team_id(name, slug, logo_url), away_team:teams!away_team_id(name, slug, logo_url), league:leagues!league_id(name, slug)"
    )
    .or(
      `and(home_team_id.eq.${teamA.id},away_team_id.eq.${teamB.id}),and(home_team_id.eq.${teamB.id},away_team_id.eq.${teamA.id})`
    )
    .not("score_home", "is", null)
    .order("date", { ascending: false });

  const allMatches = (matches || []) as any[];

  // ── Compute stats ──
  let winsA = 0;
  let winsB = 0;
  let draws = 0;
  let goalsA = 0;
  let goalsB = 0;
  let biggestWinA: any = null;
  let biggestWinADiff = 0;
  let biggestWinB: any = null;
  let biggestWinBDiff = 0;

  for (const m of allMatches) {
    const homeIsA = m.home_team_id === teamA.id;
    const scoreA = homeIsA ? m.score_home : m.score_away;
    const scoreB = homeIsA ? m.score_away : m.score_home;

    goalsA += scoreA;
    goalsB += scoreB;

    if (scoreA > scoreB) {
      winsA++;
      const diff = scoreA - scoreB;
      if (diff > biggestWinADiff) {
        biggestWinADiff = diff;
        biggestWinA = m;
      }
    } else if (scoreB > scoreA) {
      winsB++;
      const diff = scoreB - scoreA;
      if (diff > biggestWinBDiff) {
        biggestWinBDiff = diff;
        biggestWinB = m;
      }
    } else {
      draws++;
    }
  }

  const totalMatches = allMatches.length;
  const avgGoals = totalMatches > 0 ? ((goalsA + goalsB) / totalMatches).toFixed(1) : "0";

  // Bar percentages
  const barTotal = winsA + draws + winsB || 1;
  const pctA = Math.round((winsA / barTotal) * 100);
  const pctDraw = Math.round((draws / barTotal) * 100);
  const pctB = 100 - pctA - pctDraw;

  // ── JSON-LD Breadcrumb ──
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://360-foot.com" },
      {
        "@type": "ListItem",
        position: 2,
        name: `${teamA.name} vs ${teamB.name}`,
        item: `https://360-foot.com/confrontation/${slugA}-vs-${slugB}`,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* sr-only h1 */}
      <h1 className="sr-only">
        {teamA.name} vs {teamB.name} - Historique des confrontations
      </h1>

      {/* Breadcrumb JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />

      {/* ── Hero ── */}
      <section className="bg-white/80 border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
          <div className="flex items-center justify-center gap-6 sm:gap-12">
            {/* Team A */}
            <div className="flex flex-col items-center gap-2 text-center">
              <Link href={`/equipe/${teamA.slug}`} className="group">
                {teamA.logo_url ? (
                  <Image
                    src={teamA.logo_url}
                    alt={`Logo ${teamA.name}`}
                    width={80}
                    height={80}
                    className="h-16 w-16 sm:h-20 sm:w-20 object-contain transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-slate-200 flex items-center justify-center text-2xl font-bold text-slate-400">
                    {teamA.name.charAt(0)}
                  </div>
                )}
                <p className="mt-1 text-sm sm:text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  {teamA.name}
                </p>
              </Link>
              {teamA.country && (
                <span className="text-xs text-slate-500">
                  {countryToFlag(teamA.country)} {teamA.country}
                </span>
              )}
            </div>

            {/* VS */}
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600">VS</span>
              <span className="text-xs text-slate-400 mt-1">
                {totalMatches} match{totalMatches !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Team B */}
            <div className="flex flex-col items-center gap-2 text-center">
              <Link href={`/equipe/${teamB.slug}`} className="group">
                {teamB.logo_url ? (
                  <Image
                    src={teamB.logo_url}
                    alt={`Logo ${teamB.name}`}
                    width={80}
                    height={80}
                    className="h-16 w-16 sm:h-20 sm:w-20 object-contain transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-slate-200 flex items-center justify-center text-2xl font-bold text-slate-400">
                    {teamB.name.charAt(0)}
                  </div>
                )}
                <p className="mt-1 text-sm sm:text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  {teamB.name}
                </p>
              </Link>
              {teamB.country && (
                <span className="text-xs text-slate-500">
                  {countryToFlag(teamB.country)} {teamB.country}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        {/* ── Stats Summary Card ── */}
        {totalMatches > 0 && (
          <section className="rounded-xl bg-white/80 border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Bilan des confrontations</h2>

            {/* Numbers row */}
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600">{winsA}</p>
                <p className="text-xs text-slate-500">
                  Victoire{winsA !== 1 ? "s" : ""} {teamA.name}
                </p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-slate-400">{draws}</p>
                <p className="text-xs text-slate-500">Nul{draws !== 1 ? "s" : ""}</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600">{winsB}</p>
                <p className="text-xs text-slate-500">
                  Victoire{winsB !== 1 ? "s" : ""} {teamB.name}
                </p>
              </div>
            </div>

            {/* Visual bar */}
            <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100">
              {pctA > 0 && (
                <div
                  className="bg-emerald-500 transition-all duration-500"
                  style={{ width: `${pctA}%` }}
                  title={`${teamA.name}: ${pctA}%`}
                />
              )}
              {pctDraw > 0 && (
                <div
                  className="bg-slate-300 transition-all duration-500"
                  style={{ width: `${pctDraw}%` }}
                  title={`Nuls: ${pctDraw}%`}
                />
              )}
              {pctB > 0 && (
                <div
                  className="bg-emerald-700 transition-all duration-500"
                  style={{ width: `${pctB}%` }}
                  title={`${teamB.name}: ${pctB}%`}
                />
              )}
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-slate-400">
              <span>{teamA.name} ({pctA}%)</span>
              <span>Nuls ({pctDraw}%)</span>
              <span>{teamB.name} ({pctB}%)</span>
            </div>

            {/* Total matches */}
            <p className="text-center text-sm text-slate-500 mt-3">
              {totalMatches} confrontation{totalMatches !== 1 ? "s" : ""} au total
            </p>
          </section>
        )}

        {/* ── Goals Stats ── */}
        {totalMatches > 0 && (
          <section className="rounded-xl bg-white/80 border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Statistiques de buts</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-black text-emerald-600">{goalsA}</p>
                <p className="text-xs text-slate-500">Buts {teamA.name}</p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-700">{avgGoals}</p>
                <p className="text-xs text-slate-500">Moyenne buts/match</p>
              </div>
              <div>
                <p className="text-2xl font-black text-emerald-600">{goalsB}</p>
                <p className="text-xs text-slate-500">Buts {teamB.name}</p>
              </div>
            </div>
          </section>
        )}

        {/* ── Biggest Wins ── */}
        {(biggestWinA || biggestWinB) && (
          <section className="rounded-xl bg-white/80 border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Plus larges victoires</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {biggestWinA && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
                  <p className="text-xs font-semibold text-emerald-700 mb-2">
                    Plus large victoire de {teamA.name}
                  </p>
                  <Link
                    href={`/match/${biggestWinA.slug}`}
                    className="hover:text-emerald-600 transition-colors"
                  >
                    <p className="font-bold">
                      {biggestWinA.home_team?.name} {biggestWinA.score_home} - {biggestWinA.score_away}{" "}
                      {biggestWinA.away_team?.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{formatDate(biggestWinA.date)}</p>
                  </Link>
                </div>
              )}
              {biggestWinB && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
                  <p className="text-xs font-semibold text-emerald-700 mb-2">
                    Plus large victoire de {teamB.name}
                  </p>
                  <Link
                    href={`/match/${biggestWinB.slug}`}
                    className="hover:text-emerald-600 transition-colors"
                  >
                    <p className="font-bold">
                      {biggestWinB.home_team?.name} {biggestWinB.score_home} - {biggestWinB.score_away}{" "}
                      {biggestWinB.away_team?.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{formatDate(biggestWinB.date)}</p>
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Match List ── */}
        {totalMatches > 0 ? (
          <section className="rounded-xl bg-white/80 border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              Tous les matchs ({totalMatches})
            </h2>
            <div className="divide-y divide-slate-100">
              {allMatches.map((m: any) => {
                const homeIsA = m.home_team_id === teamA.id;
                const scoreA = homeIsA ? m.score_home : m.score_away;
                const scoreB = homeIsA ? m.score_away : m.score_home;
                const isWinA = scoreA > scoreB;
                const isWinB = scoreB > scoreA;
                const isDraw = scoreA === scoreB;

                return (
                  <Link
                    key={m.id}
                    href={`/match/${m.slug}`}
                    className="flex items-center gap-3 py-3 hover:bg-slate-50/80 transition-colors -mx-2 px-2 rounded-lg group"
                  >
                    {/* Date + League */}
                    <div className="w-24 sm:w-32 shrink-0">
                      <p className="text-xs text-slate-500">{formatDate(m.date)}</p>
                      {m.league?.name && (
                        <p className="text-[10px] text-slate-400 truncate">{m.league.name}</p>
                      )}
                    </div>

                    {/* Home Team */}
                    <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
                      <span
                        className={`text-sm font-medium truncate ${
                          m.home_team_id === teamA.id
                            ? isWinA
                              ? "text-emerald-700 font-bold"
                              : ""
                            : isWinB
                            ? "text-emerald-700 font-bold"
                            : ""
                        }`}
                      >
                        {m.home_team?.name}
                      </span>
                      {m.home_team?.logo_url && (
                        <Image
                          src={m.home_team.logo_url}
                          alt=""
                          width={20}
                          height={20}
                          className="h-5 w-5 object-contain shrink-0"
                        />
                      )}
                    </div>

                    {/* Score */}
                    <div
                      className={`flex items-center justify-center w-14 shrink-0 rounded-md py-1 text-sm font-black ${
                        isDraw
                          ? "bg-slate-100 text-slate-600"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {m.score_home} - {m.score_away}
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      {m.away_team?.logo_url && (
                        <Image
                          src={m.away_team.logo_url}
                          alt=""
                          width={20}
                          height={20}
                          className="h-5 w-5 object-contain shrink-0"
                        />
                      )}
                      <span
                        className={`text-sm font-medium truncate ${
                          m.away_team_id === teamA.id
                            ? isWinA
                              ? "text-emerald-700 font-bold"
                              : ""
                            : isWinB
                            ? "text-emerald-700 font-bold"
                            : ""
                        }`}
                      >
                        {m.away_team?.name}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="rounded-xl bg-white/80 border border-slate-200 p-8 text-center">
            <p className="text-slate-500">
              Aucune confrontation enregistrée entre {teamA.name} et {teamB.name}.
            </p>
          </section>
        )}

        {/* ── Affiliate ── */}
        <AffiliateTrio />
      </div>
    </main>
  );
}
