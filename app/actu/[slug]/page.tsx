import { createClient } from "@/lib/supabase";
import { addInternalLinks } from "@/lib/internal-links";
import { Breadcrumb } from "@/components/breadcrumb";
import { RelatedArticles } from "@/components/related-articles";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

export const revalidate = 1800;

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

  const articleUrl = `https://360-foot.com/actu/${slug}`;
  const articleTitle = article.seo_title || article.title;
  const rawDescription = article.seo_description || article.excerpt || "";
  const articleDescription = rawDescription.length > 155 ? rawDescription.slice(0, 152) + "..." : rawDescription;
  const articleImage = article.og_image_url || article.image || "https://360-foot.com/icon-512.png";

  return {
    title: articleTitle,
    description: articleDescription,
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      title: articleTitle,
      description: articleDescription,
      type: "article",
      url: articleUrl,
      images: [{ url: articleImage }],
      publishedTime: article.published_at,
      section: "Football",
    },
    twitter: {
      card: "summary_large_image",
      title: articleTitle,
      description: articleDescription,
      images: [articleImage],
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
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(5);

  // Fetch entities for internal linking
  const [{ data: teams }, { data: players }, { data: leagues }] = await Promise.all([
    supabase.from("teams").select("name, slug"),
    supabase.from("players").select("name, slug"),
    supabase.from("leagues").select("name, slug"),
  ]);

  // Apply internal links to article content
  let enrichedContent = article.content || "";
  try {
    enrichedContent = addInternalLinks(
      article.content || "",
      (teams || []).map((t: Record<string, unknown>) => ({ name: t.name as string, slug: t.slug as string })),
      (players || []).map((p: Record<string, unknown>) => ({ name: p.name as string, slug: p.slug as string })),
      (leagues || []).map((l: Record<string, unknown>) => ({ name: l.name as string, slug: l.slug as string }))
    );
  } catch (e) {
    console.error("Error adding internal links:", e);
  }

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Actualités", href: "/actu" },
    { label: article.title },
  ];

  const articleImageUrl = article.og_image_url || article.image || "https://360-foot.com/icon-512.png";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `https://360-foot.com/actu/${slug}#article`,
    headline: article.title,
    description: article.seo_description || article.excerpt,
    image: articleImageUrl,
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    author: {
      "@type": "Person",
      name: "Rédaction 360 Foot",
      url: "https://360-foot.com/methodologie",
    },
    publisher: {
      "@type": "Organization",
      "@id": "https://360-foot.com/#organization",
      name: "360 Foot",
      url: "https://360-foot.com",
      logo: {
        "@type": "ImageObject",
        url: "https://360-foot.com/icon-512.png",
        width: 512,
        height: 512,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://360-foot.com/actu/${slug}`,
    },
    articleSection: "Football",
    inLanguage: "fr-FR",
    isPartOf: {
      "@id": "https://360-foot.com/#website",
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
          {(article.og_image_url || article.image) && (
            <div className="relative mb-8 rounded-xl overflow-hidden aspect-video">
              <Image
                src={article.og_image_url || article.image}
                alt={article.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
            </div>
          )}

          <Separator className="bg-gray-800 mb-8" />

          {/* Contenu de l'article */}
          <div
            className="prose prose-invert prose-lime max-w-none text-justify
              prose-headings:text-white prose-headings:font-bold prose-headings:text-left
              prose-p:text-gray-300 prose-p:leading-relaxed
              prose-a:text-lime-400 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white
              prose-li:text-gray-300
              prose-figcaption:text-xs prose-figcaption:text-gray-500 prose-figcaption:italic prose-figcaption:text-center prose-figcaption:mt-2
              prose-img:rounded-lg prose-img:mx-auto"
            dangerouslySetInnerHTML={{ __html: enrichedContent }}
          />

          {/* Boutons de partage social */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-400">Partager :</span>
            <a
              href={`https://twitter.com/intent/tweet?url=https://360-foot.com/actu/${slug}&text=${encodeURIComponent(article.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-[#1DA1F2]/10 px-3 py-1.5 text-xs font-medium text-[#1DA1F2] transition-colors hover:bg-[#1DA1F2]/20"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              X / Twitter
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=https://360-foot.com/actu/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-[#1877F2]/10 px-3 py-1.5 text-xs font-medium text-[#1877F2] transition-colors hover:bg-[#1877F2]/20"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(article.title + " — https://360-foot.com/actu/" + slug)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-[#25D366]/10 px-3 py-1.5 text-xs font-medium text-[#25D366] transition-colors hover:bg-[#25D366]/20"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
            <a
              href={`https://t.me/share/url?url=https://360-foot.com/actu/${slug}&text=${encodeURIComponent(article.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-[#0088cc]/10 px-3 py-1.5 text-xs font-medium text-[#0088cc] transition-colors hover:bg-[#0088cc]/20"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              Telegram
            </a>
          </div>

          {/* Bouton affiliation contextuel */}
          <div className="mt-8">
            <AffiliateTrio />
          </div>

          <Separator className="bg-gray-800 my-8" />

          {/* Articles lies */}
          {relatedArticles && relatedArticles.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold text-lime-400 mb-4">
                Articles similaires
              </h2>
              <RelatedArticles
                articles={relatedArticles.map((a: Record<string, unknown>) => ({
                  slug: a.slug as string,
                  title: a.title as string,
                  excerpt: (a.excerpt as string) || "",
                  type: (a.type as string) || "news",
                  publishedAt: a.published_at as string,
                  leagueName: undefined,
                }))}
              />
            </div>
          )}
        </article>
      </div>
    </main>
  );
}
