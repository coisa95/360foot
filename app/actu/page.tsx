import { createClient } from "@/lib/supabase";
import { Breadcrumb } from "@/components/breadcrumb";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Actualités football africain et européen",
  description:
    "Retrouvez toutes les actualités du football africain et européen : résultats, transferts, analyses et avant-matchs.",
  alternates: {
    canonical: "https://360-foot.com/actu",
  },
  openGraph: {
    title: "Actualités football africain et européen - 360 Foot",
    description:
      "Toutes les actualités du football africain et européen sur 360 Foot.",
    type: "website",
    url: "https://360-foot.com/actu",
    images: ["/api/og?title=Actualit%C3%A9s%20football"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Actualités football africain et européen - 360 Foot",
    description: "Toutes les actualités du football africain et européen sur 360 Foot.",
  },
};

const CATEGORIES = [
  { label: "Tous", value: "all" },
  { label: "Afrique", value: "afrique" },
  { label: "Europe", value: "europe" },
  { label: "International", value: "international" },
  { label: "Résultats", value: "result" },
  { label: "Avant-matchs", value: "preview" },
  { label: "Transferts", value: "transfer" },
] as const;

// Ligues africaines (UUIDs) - utilisés pour le filtre géographique
const AFRICAN_LEAGUE_SLUGS = [
  "ligue-1-cote-divoire",
  "ligue-pro-senegal",
  "elite-one-cameroun",
  "primus-ligue-mali",
  "fasofoot-burkina-faso",
  "can",
  "qualifs-cdm-afrique",
];

const EUROPEAN_LEAGUE_SLUGS = [
  "ligue-1-france",
  "premier-league",
  "la-liga",
  "serie-a",
  "bundesliga",
  "champions-league",
  "europa-league",
  "conference-league",
  "qualifs-cdm-europe",
];

const INTERNATIONAL_LEAGUE_SLUGS = [
  "matchs-amicaux",
  "qualifs-cdm-amerique-sud",
  "mls",
  "saudi-pro-league",
];

const TYPE_LABELS: Record<string, string> = {
  result: "Résultat",
  preview: "Avant-match",
  transfer: "Transfert",
  player_profile: "Joueur",
  recap: "Récap",
  guide: "Guide",
  trending: "Tendance",
};

const TYPE_COLORS: Record<string, string> = {
  result: "bg-blue-500/20 text-blue-400",
  preview: "bg-orange-500/20 text-orange-400",
  transfer: "bg-purple-500/20 text-purple-400",
  player_profile: "bg-cyan-500/20 text-cyan-400",
  recap: "bg-emerald-500/20 text-emerald-400",
  guide: "bg-yellow-500/20 text-yellow-400",
  trending: "bg-pink-500/20 text-pink-400",
};

type Props = {
  searchParams: Promise<{ categorie?: string; page?: string }>;
};

export default async function ActuPage({ searchParams }: Props) {
  const { categorie, page: pageParam } = await searchParams;
  const activeCategory = categorie || "all";
  const currentPage = Math.max(1, parseInt(pageParam || "1", 10));
  const perPage = 20;
  const offset = (currentPage - 1) * perPage;

  const supabase = createClient();

  // Fetch league IDs for geographic filtering
  const { data: allLeagues } = await supabase
    .from("leagues")
    .select("id, slug");

  const leaguesBySlug = new Map<string, string>();
  for (const l of allLeagues || []) {
    leaguesBySlug.set(l.slug, l.id);
  }

  function getLeagueIds(slugs: string[]): string[] {
    return slugs.map((s) => leaguesBySlug.get(s)).filter(Boolean) as string[];
  }

  let query = supabase
    .from("articles")
    .select("*, league:leagues!league_id(name, slug)", { count: "exact" })
    .not("published_at", "is", null)
    .order("created_at", { ascending: false });

  // Apply filters
  if (activeCategory === "afrique") {
    const ids = getLeagueIds(AFRICAN_LEAGUE_SLUGS);
    if (ids.length > 0) query = query.in("league_id", ids);
  } else if (activeCategory === "europe") {
    const ids = getLeagueIds(EUROPEAN_LEAGUE_SLUGS);
    if (ids.length > 0) query = query.in("league_id", ids);
  } else if (activeCategory === "international") {
    const ids = getLeagueIds(INTERNATIONAL_LEAGUE_SLUGS);
    if (ids.length > 0) query = query.in("league_id", ids);
  } else if (activeCategory !== "all") {
    // Type filter (result, preview, transfer)
    query = query.eq("type", activeCategory);
  }

  const { data: articles, count } = await query
    .range(offset, offset + perPage - 1);

  const totalPages = Math.ceil((count || 0) / perPage);

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Actualités" },
  ];

  const featuredArticle = articles && articles.length > 0 ? articles[0] : null;
  const gridArticles = articles && articles.length > 1 ? articles.slice(1) : [];

  return (
    <main className="min-h-screen bg-dark-bg text-white">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">
            <span className="text-lime-400">Actu</span> Football
          </h1>

          {/* Category tabs — compact, scrollable on mobile */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide sm:gap-2">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.value}
                href={cat.value === "all" ? "/actu" : `/actu?categorie=${cat.value}`}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors sm:px-4 sm:py-1.5 sm:text-sm ${
                  activeCategory === cat.value
                    ? "bg-lime-500 text-dark-bg"
                    : "bg-dark-card text-gray-400 hover:bg-dark-surface hover:text-white"
                }`}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>

        {featuredArticle ? (
          <>
            {/* Featured article - compact on mobile, large on desktop */}
            <Link href={`/actu/${featuredArticle.slug}`} className="group mt-4 block sm:mt-6">
              <Card className="overflow-hidden border-dark-border bg-dark-card transition-all hover:border-lime-500/30">
                <div className="grid md:grid-cols-2">
                  <div className="relative aspect-[2/1] sm:aspect-video md:aspect-auto md:min-h-[280px]">
                    <Image
                      src={featuredArticle.og_image_url || `/api/og?title=${encodeURIComponent(featuredArticle.title)}&type=${featuredArticle.type || "result"}&league=${encodeURIComponent((featuredArticle.league as Record<string, unknown>)?.name as string || "")}`}
                      alt={featuredArticle.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      unoptimized={!!featuredArticle.og_image_url}
                    />
                    {/* Badge overlay on mobile */}
                    <div className="absolute left-2 top-2 md:hidden">
                      <Badge className={`text-[10px] ${TYPE_COLORS[featuredArticle.type] || "bg-lime-500/10 text-lime-400"}`}>
                        {TYPE_LABELS[featuredArticle.type] || featuredArticle.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center p-3 sm:p-4 md:p-6">
                    <div className="mb-2 hidden flex-wrap items-center gap-2 md:flex">
                      <Badge className={TYPE_COLORS[featuredArticle.type] || "bg-lime-500/10 text-lime-400"}>
                        {TYPE_LABELS[featuredArticle.type] || featuredArticle.type}
                      </Badge>
                      {String((featuredArticle.league as Record<string, unknown>)?.name || "") !== "" && (
                        <span className="text-xs text-gray-500">
                          {String((featuredArticle.league as Record<string, unknown>).name)}
                        </span>
                      )}
                    </div>
                    <h2 className="mb-1 text-base font-bold leading-tight text-white transition-colors group-hover:text-lime-400 sm:mb-2 sm:text-lg md:mb-3 md:text-2xl">
                      {featuredArticle.title}
                    </h2>
                    {featuredArticle.excerpt && (
                      <p className="mb-2 line-clamp-2 text-xs text-gray-400 sm:line-clamp-3 sm:text-sm md:mb-4">
                        {featuredArticle.excerpt}
                      </p>
                    )}
                    <time className="text-[10px] text-gray-500 sm:text-xs" dateTime={featuredArticle.created_at}>
                      {new Date(featuredArticle.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </time>
                  </div>
                </div>
              </Card>
            </Link>

            {/* Grid of smaller cards */}
            {gridArticles.length > 0 && (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {gridArticles.map((article: Record<string, unknown>) => {
                  const league = article.league as Record<string, unknown> | null;
                  const articleType = (article.type as string) || "result";
                  return (
                    <Link key={article.id as string} href={`/actu/${article.slug}`} className="group">
                      <Card className="h-full overflow-hidden border-dark-border bg-dark-card transition-all hover:border-lime-500/30 hover:bg-dark-surface">
                        <div className="relative aspect-video">
                          <Image
                            src={(article.og_image_url as string) || `/api/og?title=${encodeURIComponent(article.title as string)}&type=${articleType}&league=${encodeURIComponent((league?.name as string) || "")}`}
                            alt={article.title as string}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            unoptimized={!!(article.og_image_url)}
                          />
                          <div className="absolute left-2 top-2">
                            <Badge className={`text-[10px] ${TYPE_COLORS[articleType] || "bg-lime-500/10 text-lime-400"}`}>
                              {TYPE_LABELS[articleType] || articleType}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="mb-2 flex items-center gap-2">
                            {String(league?.name || "") !== "" && (
                              <span className="text-xs text-gray-500">{String(league?.name)}</span>
                            )}
                          </div>
                          <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-tight text-white transition-colors group-hover:text-lime-400">
                            {article.title as string}
                          </h3>
                          {String(article.excerpt || "") !== "" && (
                            <p className="mb-3 line-clamp-2 text-xs text-gray-400">
                              {String(article.excerpt)}
                            </p>
                          )}
                          <time className="text-[10px] text-gray-500" dateTime={article.created_at as string}>
                            {new Date(article.created_at as string).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </time>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
                {currentPage > 1 && (
                  <Link
                    href={`/actu?${activeCategory !== "all" ? `categorie=${activeCategory}&` : ""}page=${currentPage - 1}`}
                    className="rounded-lg bg-dark-card px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-dark-surface hover:text-white"
                  >
                    Précédent
                  </Link>
                )}

                {(() => {
                  const pages: (number | "...")[] = [];
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    if (currentPage > 3) pages.push("...");
                    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
                    if (currentPage < totalPages - 2) pages.push("...");
                    pages.push(totalPages);
                  }
                  const baseHref = activeCategory !== "all" ? `categorie=${activeCategory}&` : "";
                  return pages.map((p, idx) =>
                    p === "..." ? (
                      <span key={`ellipsis-${idx}`} className="flex h-10 w-10 items-center justify-center text-sm text-gray-500">…</span>
                    ) : (
                      <Link
                        key={p}
                        href={`/actu?${baseHref}page=${p}`}
                        className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                          currentPage === p
                            ? "bg-lime-500 text-dark-bg"
                            : "bg-dark-card text-gray-400 hover:bg-dark-surface hover:text-white"
                        }`}
                      >
                        {p}
                      </Link>
                    )
                  );
                })()}

                {currentPage < totalPages && (
                  <Link
                    href={`/actu?${activeCategory !== "all" ? `categorie=${activeCategory}&` : ""}page=${currentPage + 1}`}
                    className="rounded-lg bg-dark-card px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-dark-surface hover:text-white"
                  >
                    Suivant
                  </Link>
                )}
              </nav>
            )}
          </>
        ) : (
          <p className="mt-8 text-gray-500">
            Aucun article disponible pour le moment.
          </p>
        )}

        {/* Partenaires */}
        <div className="mt-12">
          <AffiliateTrio />
        </div>
      </div>
    </main>
  );
}
