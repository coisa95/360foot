import { createAnonClient } from "@/lib/supabase";
import { safeJsonLd } from "@/lib/json-ld";
import { getCspNonce } from "@/lib/csp-nonce";
import { ArticleCard } from "@/components/article-card";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
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

  if (!league) return { title: "Actualités introuvables" };

  const { count } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .contains("league_slugs", [slug])
    .eq("status", "published");
  const hasData = (count ?? 0) > 0;

  const title = `Actu ${league.name} — Transferts, analyses et résumés`;
  const fullDesc = `Toute l'actualité de ${league.name} : transferts, analyses tactiques, résumés de matchs et infos en direct.`;
  const description = fullDesc.length > 155 ? fullDesc.slice(0, 152) + "..." : fullDesc;

  return {
    title,
    description,
    ...(!hasData && { robots: { index: false, follow: true } }),
    alternates: { canonical: `https://360-foot.com/ligue/${slug}/actualites` },
    openGraph: { title, description, type: "website", url: `https://360-foot.com/ligue/${slug}/actualites`, locale: "fr_FR", images: [`https://360-foot.com/api/og?title=${encodeURIComponent(title)}`] },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [`https://360-foot.com/api/og?title=${encodeURIComponent(title)}`],
    },
  };
}

export default async function LeagueNewsPage({ params }: Props) {
  const { slug } = await params;
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

  const { data: articles } = await supabase
    .from("articles")
    .select("id,title,slug,excerpt,type,published_at,og_image_url")
    .eq("league_id", league.id)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(30);

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
              { "@type": "ListItem", position: 4, name: "Actualités" },
            ],
          }),
        }}
      />
      {articles && articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((article: any) => (
            <ArticleCard
              key={article.id}
              slug={article.slug}
              title={article.title}
              excerpt={article.excerpt || ""}
              type={article.type}
              publishedAt={article.published_at}
              imageUrl={article.og_image_url || null}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-slate-400 py-12">Aucune actualité disponible pour cette ligue.</p>
      )}

      <AffiliateTrio />
    </>
  );
}
