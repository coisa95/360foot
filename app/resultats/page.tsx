import { createClient } from "@/lib/supabase";
import { Breadcrumb } from "@/components/breadcrumb";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Résultats football en direct - Scores et classements - 360 Foot",
  description:
    "Tous les résultats et scores du football africain et européen en direct. Ligue 1 Côte d'Ivoire, Sénégal, Cameroun, Premier League, Champions League.",
  alternates: {
    canonical: "https://360-foot.com/resultats",
  },
  openGraph: {
    title: "Résultats football en direct - 360 Foot",
    description:
      "Scores et résultats du football africain et européen en temps réel.",
    type: "website",
    url: "https://360-foot.com/resultats",
    images: ["/api/og?title=R%C3%A9sultats%20football%20en%20direct"],
  },
};

type Props = {
  searchParams: Promise<{ ligue?: string }>;
};

export default async function ResultatsPage({ searchParams }: Props) {
  const { ligue } = await searchParams;
  const supabase = createClient();

  // Fetch finished matches
  let matchesQuery = supabase
    .from("matches")
    .select(
      `slug, date, status, score_home, score_away,
       home_team:teams!home_team_id(name, slug, logo_url),
       away_team:teams!away_team_id(name, slug, logo_url),
       league:leagues!league_id(id, name, slug)`
    )
    .in("status", ["FT", "AET", "PEN"])
    .order("date", { ascending: false })
    .limit(100);

  if (ligue) {
    // Filter by league slug via a subquery approach - first get league id
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

  // Fetch all leagues for filter
  const { data: leagues } = await supabase
    .from("leagues")
    .select("name, slug")
    .order("name");

  // Fetch articles linked to matches for "Lire l'article" links
  const matchSlugs = (matches || []).map((m: Record<string, unknown>) => m.slug as string);
  const { data: matchArticles } = await supabase
    .from("articles")
    .select("slug, match_id")
    .not("published_at", "is", null)
    .eq("type", "result")
    .not("match_id", "is", null);

  const articleByMatchSlug = new Map<string, string>();
  if (matchArticles && matches) {
    // We need match id -> match slug mapping
    // Since we don't have match id in our query results directly, let's build it differently
    // Actually, match articles have match_id, so we need to look up matches by id
    // For simplicity, let's fetch match ids separately
    const { data: matchIds } = await supabase
      .from("matches")
      .select("id, slug")
      .in("slug", matchSlugs);

    if (matchIds) {
      const matchIdToSlug = new Map(matchIds.map((m: Record<string, unknown>) => [m.id as string, m.slug as string]));
      for (const article of matchArticles) {
        const mSlug = matchIdToSlug.get(article.match_id as string);
        if (mSlug) {
          articleByMatchSlug.set(mSlug, article.slug as string);
        }
      }
    }
  }

  // Group matches by date
  const matchesByDate = new Map<string, Array<Record<string, unknown>>>();
  for (const match of (matches || []) as Array<Record<string, unknown>>) {
    const dateStr = new Date(match.date as string).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!matchesByDate.has(dateStr)) {
      matchesByDate.set(dateStr, []);
    }
    matchesByDate.get(dateStr)!.push(match);
  }

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Résultats" },
  ];

  return (
    <main className="min-h-screen bg-dark-bg text-white">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        <h1 className="mt-6 text-3xl font-bold md:text-4xl">
          <span className="text-lime-400">Résultats</span> Football
        </h1>
        <p className="mt-2 text-gray-400">
          Tous les scores et résultats des matchs terminés
        </p>

        {/* League filter */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/resultats"
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              !ligue
                ? "bg-lime-500 text-dark-bg"
                : "bg-dark-card text-gray-400 hover:bg-dark-surface hover:text-white"
            }`}
          >
            Toutes les ligues
          </Link>
          {(leagues || []).map((l: Record<string, unknown>) => (
            <Link
              key={l.slug as string}
              href={`/resultats?ligue=${l.slug}`}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                ligue === l.slug
                  ? "bg-lime-500 text-dark-bg"
                  : "bg-dark-card text-gray-400 hover:bg-dark-surface hover:text-white"
              }`}
            >
              {l.name as string}
            </Link>
          ))}
        </div>

        {/* Matches grouped by date */}
        {matchesByDate.size > 0 ? (
          <div className="mt-8 space-y-8">
            {Array.from(matchesByDate.entries()).map(([dateStr, dateMatches]) => (
              <section key={dateStr}>
                <h2 className="mb-4 flex items-center gap-3 text-lg font-semibold text-white">
                  <span className="h-px flex-1 bg-dark-border" />
                  <span className="shrink-0 capitalize">{dateStr}</span>
                  <span className="h-px flex-1 bg-dark-border" />
                </h2>
                <div className="space-y-3">
                  {dateMatches.map((match) => {
                    const homeTeam = match.home_team as Record<string, unknown> | null;
                    const awayTeam = match.away_team as Record<string, unknown> | null;
                    const league = match.league as Record<string, unknown> | null;
                    const articleSlug = articleByMatchSlug.get(match.slug as string);
                    const statusLabel =
                      match.status === "AET"
                        ? "A.P."
                        : match.status === "PEN"
                          ? "T.A.B."
                          : "";

                    return (
                      <Card
                        key={match.slug as string}
                        className="border-dark-border bg-dark-card p-4 transition-colors hover:border-lime-500/30"
                      >
                        <div className="flex items-center justify-between">
                          {/* League name */}
                          <div className="mb-2 flex w-full items-center justify-between">
                            {league && (
                              <Link
                                href={`/ligue/${league.slug}`}
                                className="text-xs text-gray-500 transition-colors hover:text-lime-400"
                              >
                                {league.name as string}
                              </Link>
                            )}
                            {statusLabel && (
                              <Badge className="bg-dark-surface text-xs text-gray-400">
                                {statusLabel}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center">
                          {/* Home team */}
                          <div className="flex flex-1 items-center justify-end gap-3">
                            <span className="text-right text-sm font-medium text-white">
                              {homeTeam ? (
                                <Link
                                  href={`/equipe/${homeTeam.slug}`}
                                  className="transition-colors hover:text-lime-400"
                                >
                                  {homeTeam.name as string}
                                </Link>
                              ) : (
                                "Équipe A"
                              )}
                            </span>
                            {String(homeTeam?.logo_url || "") !== "" && (
                              <Image
                                src={String(homeTeam?.logo_url)}
                                alt={`Logo ${String(homeTeam?.name)}`}
                                width={32}
                                height={32}
                                className="h-8 w-8 object-contain"
                              />
                            )}
                          </div>

                          {/* Score */}
                          <div className="mx-4 min-w-[5rem] text-center">
                            <span className="text-xl font-bold text-white">
                              {Number(match.score_home ?? 0)}
                              <span className="mx-1 text-gray-500">-</span>
                              {Number(match.score_away ?? 0)}
                            </span>
                          </div>

                          {/* Away team */}
                          <div className="flex flex-1 items-center gap-3">
                            {String(awayTeam?.logo_url || "") !== "" && (
                              <Image
                                src={String(awayTeam?.logo_url)}
                                alt={`Logo ${String(awayTeam?.name)}`}
                                width={32}
                                height={32}
                                className="h-8 w-8 object-contain"
                              />
                            )}
                            <span className="text-sm font-medium text-white">
                              {awayTeam ? (
                                <Link
                                  href={`/equipe/${awayTeam.slug}`}
                                  className="transition-colors hover:text-lime-400"
                                >
                                  {awayTeam.name as string}
                                </Link>
                              ) : (
                                "Équipe B"
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Link to article if exists */}
                        {articleSlug && (
                          <div className="mt-3 border-t border-dark-border pt-3 text-center">
                            <Link
                              href={`/actu/${articleSlug}`}
                              className="text-xs text-lime-400 transition-colors hover:text-lime-300"
                            >
                              Lire le compte-rendu →
                            </Link>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-dark-border bg-dark-card p-8 text-center">
            <p className="text-gray-500">
              Aucun résultat disponible pour le moment.
            </p>
          </div>
        )}

        {/* Partenaires */}
        <div className="mt-12">
          <AffiliateTrio />
        </div>
      </div>
    </main>
  );
}
