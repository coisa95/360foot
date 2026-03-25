import { createClient } from "@/lib/supabase";
import { Breadcrumb } from "@/components/breadcrumb";
import { ArticleCard } from "@/components/article-card";
import { AffiliateBanner } from "@/components/affiliate-banner";
import { Metadata } from "next";

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

export default async function ActuPage() {
  const supabase = createClient();

  const { data: articles } = await supabase
    .from("articles")
    .select("*, league:leagues!league_id(name)")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(50);

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Actualites" },
  ];

  return (
    <main className="min-h-screen bg-dark-bg text-white">
      <div className="container mx-auto px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        <h1 className="mt-6 text-3xl font-bold">
          <span className="text-lime-400">Actualites</span> Football
        </h1>
        <p className="mt-2 text-gray-400">
          Les dernieres infos du football africain et europeen
        </p>

        {articles && articles.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article: Record<string, unknown>) => {
              const league = article.league as Record<string, unknown> | null;
              return (
                <ArticleCard
                  key={article.id as string}
                  slug={article.slug as string}
                  title={article.title as string}
                  excerpt={(article.excerpt as string) || ""}
                  type={(article.type as string) || "news"}
                  publishedAt={(article.created_at as string) || ""}
                  leagueName={(league?.name as string) || undefined}
                />
              );
            })}
          </div>
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
