import { createAnonClient } from "@/lib/supabase";
import { safeJsonLd } from "@/lib/json-ld";
import { getCspNonce } from "@/lib/csp-nonce";
import { Breadcrumb } from "@/components/breadcrumb";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Metadata ──

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAnonClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: match } = await supabase
    .from("matches")
    .select(
      "id,slug,date,status,predictions_json,home_team:teams!home_team_id(name,slug,logo_url),away_team:teams!away_team_id(name,slug,logo_url),league:leagues!league_id(name,slug)"
    )
    .eq("slug", slug)
    .single() as { data: any };

  if (!match) {
    // Opt out of ISR cache for 404 — otherwise Next.js caches the
    // not-found response with HTTP 200, not 404.
    headers();
    notFound();
  }

  const homeName = match.home_team?.name || "Equipe A";
  const awayName = match.away_team?.name || "Equipe B";
  const dateStr = new Date(match.date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const title = `Pronostic ${homeName} vs ${awayName} - ${dateStr}`;
  const description =
    `Pronostic ${homeName} vs ${awayName} du ${dateStr}. Analyse, cotes, confrontations directes et absents. Notre prédiction.`;

  const hasPredictions = !!(
    match.predictions_json &&
    Object.keys(match.predictions_json).length > 0
  );
  const robots = hasPredictions ? undefined : { index: false, follow: true };

  return {
    title,
    description,
    robots,
    alternates: { canonical: `https://360-foot.com/pronostic/${slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://360-foot.com/pronostic/${slug}`,
      locale: "fr_FR",
      images: [
        `https://360-foot.com/api/og?title=${encodeURIComponent(title)}`,
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        `https://360-foot.com/api/og?title=${encodeURIComponent(title)}`,
      ],
    },
  };
}

// ── Helpers ──

function formBadge(r: string, i: number) {
  const map: Record<string, { label: string; cls: string }> = {
    W: { label: "V", cls: "bg-green-50 text-green-600 border-green-200" },
    D: { label: "N", cls: "bg-amber-50 text-amber-600 border-amber-200" },
    L: { label: "D", cls: "bg-red-50 text-red-600 border-red-200" },
  };
  const info = map[r] || { label: r, cls: "bg-slate-100 text-slate-500" };
  return (
    <span
      key={i}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md border text-xs font-bold ${info.cls}`}
    >
      {info.label}
    </span>
  );
}

const compLabels: Record<string, string> = {
  Form: "Forme",
  Att: "Attaque",
  Def: "Defense",
  "Poisson Distribution": "Distribution",
  H2H: "Confrontations",
  Goals: "Buts",
  Total: "Global",
};

// ── Main Component ──

export default async function PronosticPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createAnonClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: match } = await supabase
    .from("matches")
    .select(
      "id,slug,date,status,score_home,score_away,predictions_json,h2h_json,injuries_json,home_team:teams!home_team_id(name,slug,logo_url),away_team:teams!away_team_id(name,slug,logo_url),league:leagues!league_id(name,slug)"
    )
    .eq("slug", slug)
    .single() as { data: any };

  if (!match) {
    // Opt out of ISR cache for 404 — otherwise Next.js caches the
    // not-found response with HTTP 200, not 404.
    headers();
    notFound();
  }

  // Redirect finished matches to the match page
  if (match.status === "FT") {
    redirect(`/match/${slug}`);
  }

  const homeName = match.home_team?.name || "Equipe A";
  const awayName = match.away_team?.name || "Equipe B";
  const homeSlug = match.home_team?.slug || "";
  const awaySlug = match.away_team?.slug || "";
  const leagueName = match.league?.name || "";
  const leagueSlug = match.league?.slug || "";

  const predictionsJson = match.predictions_json as any | null;
  const h2hJson = match.h2h_json as any[] | null;
  const injuriesJson = match.injuries_json as any[] | null;

  const hasPredictions = !!(
    predictionsJson && Object.keys(predictionsJson).length > 0
  );

  const dateStr = new Date(match.date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = new Date(match.date).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Competitions", href: "/competitions" },
    ...(leagueName
      ? [{ label: leagueName, href: `/ligue/${leagueSlug}` }]
      : []),
    { label: `Pronostic ${homeName} vs ${awayName}` },
  ];

  // ── H2H summary for FAQ ──
  const h2hSummary = (() => {
    if (!h2hJson || h2hJson.length === 0) return "Aucune confrontation directe recente disponible.";
    let homeWins = 0;
    let awayWins = 0;
    let draws = 0;
    for (const h of h2hJson) {
      if (h.homeScore > h.awayScore) homeWins++;
      else if (h.awayScore > h.homeScore) awayWins++;
      else draws++;
    }
    return `Sur les ${h2hJson.length} derniers face-a-face : ${homeWins} victoire(s) pour ${homeName}, ${awayWins} pour ${awayName} et ${draws} nul(s).`;
  })();

  // ── Injuries summary for FAQ ──
  const injuriesSummary = (() => {
    if (!injuriesJson || injuriesJson.length === 0)
      return "Aucun absent signale pour ce match.";
    const homeInj = injuriesJson.filter((inj: any) => inj.team === homeName);
    const awayInj = injuriesJson.filter((inj: any) => inj.team === awayName);
    const parts: string[] = [];
    if (homeInj.length > 0)
      parts.push(
        `${homeName} : ${homeInj.map((inj: any) => inj.player).join(", ")}`
      );
    if (awayInj.length > 0)
      parts.push(
        `${awayName} : ${awayInj.map((inj: any) => inj.player).join(", ")}`
      );
    return parts.join(". ") + ".";
  })();

  // ── FAQ JSON-LD ──
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Qui va gagner ${homeName} vs ${awayName} ?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: predictionsJson?.advice || `Pronostic en cours d'elaboration pour ${homeName} vs ${awayName}.`,
        },
      },
      {
        "@type": "Question",
        name: "Quel est le bilan des confrontations directes ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: h2hSummary,
        },
      },
      {
        "@type": "Question",
        name: "Quels joueurs sont absents pour ce match ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: injuriesSummary,
        },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-transparent text-slate-900">
      {/* Breadcrumb JSON-LD is embedded inside the Breadcrumb component */}
      <script
        type="application/ld+json"
        nonce={getCspNonce()}
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }}
      />

      <div className="container mx-auto max-w-4xl px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        <h1 className="sr-only">
          Pronostic {homeName} vs {awayName} - {leagueName}
        </h1>

        {/* ── Hero Section ── */}
        <Card className="mt-6 overflow-hidden border-slate-200 bg-white">
          <div className="p-6 text-center">
            {leagueName && (
              <Link href={`/ligue/${leagueSlug}`}>
                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer">
                  {leagueName}
                </Badge>
              </Link>
            )}
            <p className="mt-2 text-xs text-slate-400">
              {dateStr} a {timeStr}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 px-4 pb-8 sm:gap-8">
            {/* Home team */}
            <div className="flex-1 text-center">
              {match.home_team?.logo_url && (
                <Image
                  src={match.home_team.logo_url}
                  alt={`Logo ${homeName}`}
                  width={80}
                  height={80}
                  className="mx-auto mb-2 h-16 w-16 object-contain sm:h-20 sm:w-20"
                />
              )}
              <h2 className="font-display text-sm font-bold sm:text-lg">
                {homeSlug ? (
                  <Link
                    href={`/equipe/${homeSlug}`}
                    className="hover:text-emerald-600 transition-colors"
                  >
                    {homeName}
                  </Link>
                ) : (
                  homeName
                )}
              </h2>
            </div>

            {/* VS */}
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-400">VS</div>
              <Badge className="mt-2 bg-emerald-50 text-emerald-600 border-emerald-200">
                Pronostic
              </Badge>
            </div>

            {/* Away team */}
            <div className="flex-1 text-center">
              {match.away_team?.logo_url && (
                <Image
                  src={match.away_team.logo_url}
                  alt={`Logo ${awayName}`}
                  width={80}
                  height={80}
                  className="mx-auto mb-2 h-16 w-16 object-contain sm:h-20 sm:w-20"
                />
              )}
              <h2 className="font-display text-sm font-bold sm:text-lg">
                {awaySlug ? (
                  <Link
                    href={`/equipe/${awaySlug}`}
                    className="hover:text-emerald-600 transition-colors"
                  >
                    {awayName}
                  </Link>
                ) : (
                  awayName
                )}
              </h2>
            </div>
          </div>
        </Card>

        {/* ── No predictions fallback ── */}
        {!hasPredictions && (
          <Card className="mt-4 border-slate-200 card-glass p-8 text-center">
            <p className="text-lg font-display font-bold text-slate-700">
              Pronostic bientot disponible
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Notre analyse pour {homeName} vs {awayName} sera publiee
              prochainement. Revenez avant le coup d&apos;envoi.
            </p>
            <Link
              href={`/match/${slug}`}
              className="mt-4 inline-block rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-500"
            >
              Voir la fiche match
            </Link>
          </Card>
        )}

        {/* ── Prediction Summary Card ── */}
        {hasPredictions && (
          <>
            <Card className="mt-4 border-slate-200 card-glass p-4 sm:p-6">
              <h3 className="font-display mb-4 text-lg font-bold text-emerald-600">
                Notre pronostic
              </h3>

              {/* Winner prediction */}
              {predictionsJson.winner && (
                <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center">
                  <p className="text-xs uppercase tracking-wider text-emerald-600 font-medium mb-1">
                    Vainqueur probable
                  </p>
                  <p className="text-xl font-display font-bold text-slate-900">
                    {typeof predictionsJson.winner === "string"
                      ? predictionsJson.winner
                      : predictionsJson.winner?.name || ""}
                  </p>
                  {typeof predictionsJson.winner === "object" &&
                    predictionsJson.winner?.comment && (
                      <p className="mt-1 text-xs text-emerald-700">
                        {predictionsJson.winner.comment}
                      </p>
                    )}
                </div>
              )}

              {/* Advice */}
              {predictionsJson.advice && (
                <div className="mb-4 rounded-lg bg-slate-50 p-3 text-center">
                  <p className="text-sm font-medium text-slate-900">
                    {predictionsJson.advice}
                  </p>
                </div>
              )}

              {/* Win probability bars */}
              {predictionsJson.percent && (
                <div className="mb-4">
                  <p className="text-xs text-slate-400 font-medium mb-2">
                    Probabilites
                  </p>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700">
                      {homeName}
                    </span>
                    <span className="text-slate-500">Nul</span>
                    <span className="font-medium text-slate-700">
                      {awayName}
                    </span>
                  </div>
                  <div className="flex h-4 gap-0.5 overflow-hidden rounded-full">
                    <div
                      className="bg-emerald-500 rounded-l-full transition-all flex items-center justify-center"
                      style={{
                        width: predictionsJson.percent.home || "33%",
                      }}
                    >
                      <span className="text-[10px] font-bold text-white">
                        {predictionsJson.percent.home}
                      </span>
                    </div>
                    <div
                      className="bg-slate-300 transition-all flex items-center justify-center"
                      style={{
                        width: predictionsJson.percent.draw || "33%",
                      }}
                    >
                      <span className="text-[10px] font-bold text-slate-700">
                        {predictionsJson.percent.draw}
                      </span>
                    </div>
                    <div
                      className="bg-blue-400 rounded-r-full transition-all flex items-center justify-center"
                      style={{
                        width: predictionsJson.percent.away || "33%",
                      }}
                    >
                      <span className="text-[10px] font-bold text-white">
                        {predictionsJson.percent.away}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Goals & Under/Over */}
              {(predictionsJson.goals || predictionsJson.under_over) && (
                <div className="flex flex-wrap gap-3 mb-4">
                  {predictionsJson.goals && (
                    <div className="flex-1 min-w-[120px] rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
                      <p className="text-xs text-slate-400 mb-1">
                        Buts attendus
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {typeof predictionsJson.goals === "string"
                          ? predictionsJson.goals
                          : `${predictionsJson.goals?.home ?? "?"} - ${predictionsJson.goals?.away ?? "?"}`}
                      </p>
                    </div>
                  )}
                  {predictionsJson.under_over && (
                    <div className="flex-1 min-w-[120px] rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
                      <p className="text-xs text-slate-400 mb-1">
                        Under / Over
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {predictionsJson.under_over}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* ── Comparison ── */}
            {predictionsJson.comparison &&
              Object.keys(predictionsJson.comparison).length > 0 && (
                <Card className="mt-4 border-slate-200 card-glass p-4 sm:p-6">
                  <h3 className="font-display mb-4 text-lg font-bold text-emerald-600">
                    Comparaison des equipes
                  </h3>
                  <div className="flex justify-between text-xs text-slate-400 mb-3">
                    <span className="font-medium">{homeName}</span>
                    <span className="font-medium">{awayName}</span>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(predictionsJson.comparison).map(
                      ([key, val]: [string, any]) => {
                        // Defensive: val.home/away can sometimes be objects (API-Football
                        // structure drift). Coerce to string — prevents React crash.
                        const safeHome =
                          val == null
                            ? ""
                            : typeof val.home === "object"
                              ? JSON.stringify(val.home)
                              : String(val.home ?? "");
                        const safeAway =
                          val == null
                            ? ""
                            : typeof val.away === "object"
                              ? JSON.stringify(val.away)
                              : String(val.away ?? "");
                        const homePercent = parseInt(safeHome) || 50;
                        return (
                          <div key={key}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium text-slate-700">
                                {safeHome}
                              </span>
                              <span className="text-slate-400">
                                {compLabels[key] || key}
                              </span>
                              <span className="font-medium text-slate-700">
                                {safeAway}
                              </span>
                            </div>
                            <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
                              <div
                                className="bg-emerald-500 rounded-l-full transition-all"
                                style={{ width: `${homePercent}%` }}
                              />
                              <div
                                className="bg-blue-400 rounded-r-full transition-all"
                                style={{ width: `${100 - homePercent}%` }}
                              />
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </Card>
              )}

            {/* ── Form Guide ── */}
            {(predictionsJson.home_form || predictionsJson.away_form) && (
              <Card className="mt-4 border-slate-200 card-glass p-4 sm:p-6">
                <h3 className="font-display mb-4 text-lg font-bold text-emerald-600">
                  Forme recente
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {predictionsJson.home_form && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">
                        {homeName}
                      </p>
                      <div className="flex gap-1.5">
                        {predictionsJson.home_form
                          .split("")
                          .map((r: string, i: number) => formBadge(r, i))}
                      </div>
                      {predictionsJson.home_goals_last5 != null && (
                        <p className="mt-2 text-xs text-slate-400">
                          {/* Legacy rows store {for:{total},against:{total}}; new rows store a number. */}
                          {typeof predictionsJson.home_goals_last5 === "number"
                            ? predictionsJson.home_goals_last5
                            : (predictionsJson.home_goals_last5?.for?.total ?? 0)}{" "}
                          buts sur les 5 derniers matchs
                        </p>
                      )}
                    </div>
                  )}
                  {predictionsJson.away_form && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">
                        {awayName}
                      </p>
                      <div className="flex gap-1.5">
                        {predictionsJson.away_form
                          .split("")
                          .map((r: string, i: number) => formBadge(r, i))}
                      </div>
                      {predictionsJson.away_goals_last5 != null && (
                        <p className="mt-2 text-xs text-slate-400">
                          {typeof predictionsJson.away_goals_last5 === "number"
                            ? predictionsJson.away_goals_last5
                            : (predictionsJson.away_goals_last5?.for?.total ?? 0)}{" "}
                          buts sur les 5 derniers matchs
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </>
        )}

        {/* ── Affiliate ── */}
        <div className="mt-6">
          <AffiliateTrio />
        </div>

        {/* ── Head to Head ── */}
        {h2hJson && h2hJson.length > 0 && (
          <Card className="mt-4 border-slate-200 card-glass p-4 sm:p-6">
            <h3 className="font-display mb-4 text-lg font-bold text-emerald-600">
              Confrontations directes
            </h3>
            <div className="space-y-2">
              {h2hJson.map((h2h: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                >
                  <span className="text-xs text-slate-400 w-20 shrink-0">
                    {new Date(h2h.date).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span
                    className={`flex-1 text-right truncate ${
                      h2h.homeScore > h2h.awayScore
                        ? "text-slate-900 font-medium"
                        : "text-slate-500"
                    }`}
                  >
                    {h2h.homeTeam}
                  </span>
                  <span className="mx-3 font-bold text-emerald-600 shrink-0">
                    {h2h.homeScore} - {h2h.awayScore}
                  </span>
                  <span
                    className={`flex-1 truncate ${
                      h2h.awayScore > h2h.homeScore
                        ? "text-slate-900 font-medium"
                        : "text-slate-500"
                    }`}
                  >
                    {h2h.awayTeam}
                  </span>
                  {h2h.league && (
                    <span className="hidden sm:inline text-xs text-slate-300 ml-2 shrink-0">
                      {h2h.league}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── Injuries / Absences ── */}
        {injuriesJson && injuriesJson.length > 0 && (
          <Card className="mt-4 border-slate-200 card-glass p-4 sm:p-6">
            <h3 className="font-display mb-4 text-lg font-bold text-emerald-600">
              Absents et blesses
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Home team injuries */}
              <div>
                <p className="text-sm font-medium text-slate-900 mb-2">
                  {homeName}
                </p>
                <div className="space-y-1.5">
                  {injuriesJson
                    .filter((inj: any) => inj.team === homeName)
                    .map((inj: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span
                          className={`shrink-0 text-xs ${
                            inj.type === "suspended"
                              ? "text-amber-600"
                              : "text-red-600"
                          }`}
                        >
                          {inj.type === "suspended" ? "!" : "+"}
                        </span>
                        <span className="flex-1 text-slate-700">
                          {inj.player}
                        </span>
                        <span className="text-xs text-slate-400">
                          {inj.reason}
                        </span>
                      </div>
                    ))}
                  {injuriesJson.filter((inj: any) => inj.team === homeName)
                    .length === 0 && (
                    <p className="text-xs text-slate-400">
                      Aucun absent signale
                    </p>
                  )}
                </div>
              </div>
              {/* Away team injuries */}
              <div>
                <p className="text-sm font-medium text-slate-900 mb-2">
                  {awayName}
                </p>
                <div className="space-y-1.5">
                  {injuriesJson
                    .filter((inj: any) => inj.team === awayName)
                    .map((inj: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span
                          className={`shrink-0 text-xs ${
                            inj.type === "suspended"
                              ? "text-amber-600"
                              : "text-red-600"
                          }`}
                        >
                          {inj.type === "suspended" ? "!" : "+"}
                        </span>
                        <span className="flex-1 text-slate-700">
                          {inj.player}
                        </span>
                        <span className="text-xs text-slate-400">
                          {inj.reason}
                        </span>
                      </div>
                    ))}
                  {injuriesJson.filter((inj: any) => inj.team === awayName)
                    .length === 0 && (
                    <p className="text-xs text-slate-400">
                      Aucun absent signale
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* ── CTA Section ── */}
        <Card className="mt-6 border-slate-200 card-glass p-6 text-center">
          <Separator className="bg-slate-200 mb-6" />
          <p className="text-sm text-slate-500 mb-4">
            Retrouvez toutes les informations du match, les compositions et le
            score en direct.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/match/${slug}`}
              className="inline-flex items-center rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-500"
            >
              Voir la fiche match
            </Link>
            <Link
              href="/go/1xbet"
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Parier sur ce match
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
