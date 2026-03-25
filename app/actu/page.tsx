import { createClient } from "@/lib/supabase";
import { Breadcrumb } from "@/components/breadcrumb";
import { AffiliateBanner } from "@/components/affiliate-banner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Actualites football africain et europeen - 360 Foot",
  description:
    "Retrouvez toutes les actualites du football africain et europeen : resultats, transferts, analyses et avant-matchs.",
  openGraph: {
    title: "Actualites football - 360 Foot",
    description:
      "Toutes les actualites du football africain et europeen sur 360 Foot.",
    type: "website",
    url: "https://360-foot.com/actu",
  },
};

const CATEGORIES = [
  { label: "Tous", value: "all" },
  { label: "Résultats", value: "result" },
  { label: "Previews", value: "preview" },
  { label: "Transferts", value: "transfer" },
  { label: "Récaps", value: "recap" },
] as const;

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

  let query = supabase
    .from("articles")
    .select("*, league:leagues!league_id(name, slug)", { count: "exact" })
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (activeCategory !== "all") {
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

        <h1 className="mt-6 text-3xl font-bold md:text-4xl">
          <span className="text-lime-400">Actualités</span> Football
        </h1>
        <p className="mt-2 text-gray-400">
          Les dernières infos du football africain et européen
        </p>

        {/* Category tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.value}
              href={cat.value === "all" ? "/actu" : `/actu?categorie=${cat.value}`}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeCategory === cat.value
                  ? "bg-lime-500 text-dark-bg"
                  : "bg-dark-card text-gray-400 hover:bg-dark-surface hover:text-white"
              }`}
            >
              {cat.label}
            </Link>
          ))}
        </div>

        {featuredArticle ? (
          <>
            {/* Featured article - large card */}
            <Link href={`/actu/${featuredArticle.slug}`} className="group mt-8 block">
              <Card className="overflow-hidden border-dark-border bg-dark-card transition-all hover:border-lime-500/30">
                <div className="grid md:grid-cols-2">
                  <div className="relative aspect-video md:aspect-auto md:min-h-[300px]">
                    <Image
                      src={`/api/og?title=${encodeURIComponent(featuredArticle.title)}&type=${featuredArticle.type || "result"}&league=${encodeURIComponent((featuredArticle.league as Record<string, unknown>)?.name as string || "")}`}
                      alt={featuredArticle.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <div className="flex flex-col justify-center p-6">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge className={TYPE_COLORS[featuredArticle.type] || "bg-lime-500/10 text-lime-400"}>
                        {TYPE_LABELS[featuredArticle.type] || featuredArticle.type}
                      </Badge>
                      {String((featuredArticle.league as Record<string, unknown>)?.name || "") !== "" && (
                        <span className="text-xs text-gray-500">
                          {String((featuredArticle.league as Record<string, unknown>).name)}
                        </span>
                      )}
                    </div>
                    <h2 className="mb-3 text-2xl font-bold leading-tight text-white transition-colors group-hover:text-lime-400">
                      {featuredArticle.title}
                    </h2>
                    {featuredArticle.excerpt && (
                      <p className="mb-4 line-clamp-3 text-gray-400">
                        {featuredArticle.excerpt}
                      </p>
                    )}
                    <time className="text-xs text-gray-500" dateTime={featuredArticle.created_at}>
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
                            src={`/api/og?title=${encodeURIComponent(article.title as string)}&type=${articleType}&league=${encodeURIComponent((league?.name as string) || "")}`}
                            alt={article.title as string}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
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

                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }

                  return (
                    <Link
                      key={pageNum}
                      href={`/actu?${activeCategory !== "all" ? `categorie=${activeCategory}&` : ""}page=${pageNum}`}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? "bg-lime-500 text-dark-bg"
                          : "bg-dark-card text-gray-400 hover:bg-dark-surface hover:text-white"
                      }`}
                    >
                      {pageNum}
                    </Link>
                  );
                })}

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

        {/* Banniere affiliation */}
        <div className="mt-12">
          <AffiliateBanner
            bookmakerName="1xBet"
            affiliateUrl="https://reffpa.com/L?tag=d_689933m_1573c_bonus&site=689933&ad=1573"
            bonus="Bonus de bienvenue jusqu'a 200 000 FCFA"
          />
        </div>
      </div>
    </main>
  );
}
