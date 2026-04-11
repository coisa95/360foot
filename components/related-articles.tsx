import { ArticleCard } from "./article-card";

interface RelatedArticle {
  slug: string;
  title: string;
  excerpt: string;
  type: string;
  publishedAt: string;
  leagueName?: string;
}

interface RelatedArticlesProps {
  articles: RelatedArticle[];
}

export function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-lg font-bold text-slate-900">À lire aussi</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.slug} {...article} />
        ))}
      </div>
    </section>
  );
}
