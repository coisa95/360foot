import { createClient } from "@/lib/supabase";
import { Breadcrumb } from "@/components/breadcrumb";
import { RelatedArticles } from "@/components/related-articles";
import { AffiliateButton } from "@/components/affiliate-button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createClient();

  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!article) return { title: "Article introuvable - 360 Foot" };

  return {
    title: article.seo_title || `${article.title} - 360 Foot`,
    description: article.seo_description || article.excerpt,
    openGraph: {
      title: article.seo_title || article.title,
      description: article.seo_description || article.excerpt,
      type: "article",
      url: `https://360-foot.com/actu/${slug}`,
      images: article.image ? [{ url: article.image }] : undefined,
      publishedTime: article.published_at,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const supabase = createClient();

  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!article) notFound();

  const { data: relatedArticles } = await supabase
    .from("articles")
    .select("*")
    .neq("id", article.id)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(5);

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Actualites", href: "/actu" },
    { label: article.title },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.seo_description || article.excerpt,
    image: article.image || undefined,
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    author: {
      "@type": "Organization",
      name: "360 Foot",
      url: "https://360-foot.com",
    },
    publisher: {
      "@type": "Organization",
      name: "360 Foot",
      url: "https://360-foot.com",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://360-foot.com/actu/${slug}`,
    },
  };

  const typeBadgeColor: Record<string, string> = {
    match_report: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    transfer: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    preview: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    analysis: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    news: "bg-lime-500/20 text-lime-400 border-lime-500/30",
  };

  const typeLabels: Record<string, string> = {
    match_report: "Compte-rendu",
    transfer: "Transfert",
    preview: "Avant-match",
    analysis: "Analyse",
    news: "Actualite",
  };

  return (
    <main className="min-h-screen bg-dark-bg text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container mx-auto px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        <article className="mt-6 max-w-3xl mx-auto">
          {/* En-tete de l'article */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              {article.type && (
                <Badge className={typeBadgeColor[article.type] || typeBadgeColor.news}>
                  {typeLabels[article.type] || article.type}
                </Badge>
              )}
              <time className="text-gray-400 text-sm">
                {new Date(article.published_at).toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold leading-tight">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="text-gray-400 text-lg mt-4 leading-relaxed">
                {article.excerpt}
              </p>
            )}
          </header>

          {/* Image */}
          {article.image && (
            <div className="mb-8 rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          <Separator className="bg-gray-800 mb-8" />

          {/* Contenu de l'article */}
          <div
            className="prose prose-invert prose-lime max-w-none
              prose-headings:text-white prose-headings:font-bold
              prose-p:text-gray-300 prose-p:leading-relaxed
              prose-a:text-lime-400 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white
              prose-li:text-gray-300"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Bouton affiliation contextuel */}
          <div className="mt-8">
            <AffiliateButton
              bookmakerName="1xBet"
              affiliateUrl="https://1xbet.com/?ref=360foot"
              bonus="Bonus 100%"
              articleId={article.id}
            />
          </div>

          <Separator className="bg-gray-800 my-8" />

          {/* Articles lies */}
          {relatedArticles && relatedArticles.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold text-lime-400 mb-4">
                Articles similaires
              </h2>
              <RelatedArticles articles={relatedArticles} />
            </div>
          )}
        </article>
      </div>
    </main>
  );
}
