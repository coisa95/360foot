import { createClient } from "@/lib/supabase";
import { safeJsonLd } from "@/lib/json-ld";
import { addInternalLinks } from "@/lib/internal-links";
import { Breadcrumb } from "@/components/breadcrumb";
import { RelatedArticles } from "@/components/related-articles";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { ShareButtons } from "@/components/share-buttons";
import { Badge } from "@/components/ui/badge";
import { getArticleTypeLabel, getArticleTypeColor } from "@/lib/article-types";
import { Separator } from "@/components/ui/separator";
import { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

export const revalidate = 1800;
export const maxDuration = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createClient();

  const { data: article } = await supabase
    .from("articles")
    .select("title,slug,seo_title,seo_description,excerpt,og_image_url,published_at")
    .eq("slug", slug)
    .single();

  if (!article) return { title: "Article introuvable - 360 Foot" };

  const articleUrl = `https://360-foot.com/actu/${slug}`;
  const articleTitle = article.seo_title || article.title;
  const rawDescription = article.seo_description || article.excerpt || "";
  const articleDescription = rawDescription.length > 155 ? rawDescription.slice(0, 152) + "..." : rawDescription;
  const articleImage = article.og_image_url || "https://360-foot.com/icon-512.png";

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
      locale: "fr_FR",
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

  const { data: article, error: articleError } = await supabase
    .from("articles")
    .select("id,title,slug,content,excerpt,type,tags,published_at,og_image_url,seo_title,seo_description,league_id,match_id")
    .eq("slug", slug)
    .single();

  if (articleError) {
    console.error("[ArticlePage] Supabase error for slug:", slug, "Error:", articleError.message);
  }

  if (!article) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let relatedArticles: any[] | null = null;
  let teams: Record<string, unknown>[] | null = null;
  let players: Record<string, unknown>[] | null = null;
  let leagues: Record<string, unknown>[] | null = null;

  try {
    const results = await Promise.all([
      supabase.from("articles").select("id,title,slug,excerpt,type,published_at,og_image_url").neq("id", article.id).not("published_at", "is", null).order("published_at", { ascending: false }).limit(5),
      // Limites explicites pour éviter les N+1 / row scans ; 300 suffit à couvrir
      // la totalité des équipes/joueurs/ligues indexés à ce jour.
      supabase.from("teams").select("name, slug").order("name").limit(300),
      supabase.from("players").select("name, slug").order("name").limit(500),
      supabase.from("leagues").select("name, slug").order("name").limit(60),
    ]);
    relatedArticles = results[0].data;
    teams = results[1].data;
    players = results[2].data;
    leagues = results[3].data;
  } catch (e) {
    console.error("[ArticlePage] Error fetching related data:", e);
  }

  // Apply internal links to article content + sanitize HTML
  let enrichedContent = article.content || "";
  try {
    const sanitizeHtml = (await import("sanitize-html")).default;
    enrichedContent = sanitizeHtml(enrichedContent, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "figure", "figcaption"]),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ["src", "alt", "width", "height", "loading", "class"],
        a: ["href", "target", "rel", "class"],
        div: ["class"],
        p: ["class"],
        span: ["class"],
        h2: ["class", "id"],
        h3: ["class", "id"],
        figure: ["class"],
        figcaption: ["class"],
      },
      allowedSchemes: ["https", "http"],
      // Force rel="noopener noreferrer nofollow ugc" sur tous les liens externes
      // pour : (1) bloquer les attaques tabnabbing, (2) ne pas transmettre
      // d'autorité SEO à des sites non contrôlés, (3) marquer le contenu comme
      // user-generated si jamais un article inclut des citations externes.
      transformTags: {
        a: (tagName, attribs) => {
          const href = attribs.href || "";
          const isExternal = /^https?:\/\//i.test(href) && !/(^|\/\/)([^/]*\.)?360-foot\.com/i.test(href);
          if (isExternal) {
            return {
              tagName: "a",
              attribs: {
                ...attribs,
                target: "_blank",
                rel: "noopener noreferrer nofollow ugc",
              },
            };
          }
          return { tagName, attribs };
        },
      },
    });
    enrichedContent = addInternalLinks(
      enrichedContent,
      (teams || []).map((t: Record<string, unknown>) => ({ name: t.name as string, slug: t.slug as string })),
      (players || []).map((p: Record<string, unknown>) => ({ name: p.name as string, slug: p.slug as string })),
      (leagues || []).map((l: Record<string, unknown>) => ({ name: l.name as string, slug: l.slug as string }))
    );
  } catch (e) {
    console.error("Error processing article content:", e);
    // If sanitization failed, strip all HTML to prevent XSS
    enrichedContent = (article.content || "").replace(/<[^>]*>/g, "");
  }

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Actualités", href: "/actu" },
    { label: article.title },
  ];

  const articleImageUrl = article.og_image_url || "https://360-foot.com/icon-512.png";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `https://360-foot.com/actu/${slug}#article`,
    headline: article.title,
    description: article.seo_description || article.excerpt || "",
    image: {
      "@type": "ImageObject",
      url: articleImageUrl,
      width: 1200,
      height: 630,
    },
    datePublished: article.published_at,
    // Note: la table articles n'a pas de colonne updated_at (cf schéma).
    // Pour distinguer dateModified, ajouter `updated_at TIMESTAMPTZ` + trigger
    // dans une migration séparée. Pour l'instant on retombe sur published_at.
    dateModified: article.published_at,
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

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: "https://360-foot.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Actualités",
        item: "https://360-foot.com/actu",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: `https://360-foot.com/actu/${slug}`,
      },
    ],
  };

  // Type labels and colors from shared utility (lib/article-types.ts)

  return (
    <main className="min-h-screen bg-transparent text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />

      <div className="container mx-auto px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        <article className="mt-6 max-w-3xl mx-auto">
          {/* En-tete de l'article */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              {article.type && (
                <Badge className={getArticleTypeColor(article.type)}>
                  {getArticleTypeLabel(article.type)}
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

            <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="text-gray-400 text-lg mt-4 leading-relaxed">
                {article.excerpt}
              </p>
            )}
          </header>

          {/* Image */}
          {article.og_image_url && (
            <div className="relative mb-8 rounded-xl overflow-hidden aspect-video">
              <Image
                src={article.og_image_url}
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
            className="prose prose-invert prose-emerald max-w-none text-justify
              prose-headings:text-white prose-headings:font-bold prose-headings:text-left
              prose-p:text-gray-300 prose-p:leading-relaxed
              prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white
              prose-li:text-gray-300
              prose-figcaption:text-xs prose-figcaption:text-gray-500 prose-figcaption:italic prose-figcaption:text-center prose-figcaption:mt-2
              prose-img:rounded-lg prose-img:mx-auto"
            dangerouslySetInnerHTML={{ __html: enrichedContent }}
          />

          {/* Boutons de partage social */}
          <ShareButtons title={article.title} slug={slug} />

          {/* Bouton affiliation contextuel */}
          <div className="mt-8">
            <AffiliateTrio />
          </div>

          <Separator className="bg-gray-800 my-8" />

          {/* Articles lies */}
          {relatedArticles && relatedArticles.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-xl font-bold text-emerald-400 mb-4">
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
