/**
 * Shared article type labels and colors.
 * Single source of truth — used by actu/page.tsx, actu/[slug]/page.tsx, article-card.tsx
 */

export const ARTICLE_TYPE_LABELS: Record<string, string> = {
  result: "Résultat",
  match_report: "Compte-rendu",
  preview: "Avant-match",
  transfer: "Transfert",
  player_profile: "Joueur",
  recap: "Récap",
  guide: "Guide",
  trending: "Tendance",
  analysis: "Analyse",
  news: "Actualité",
  streaming: "Streaming",
};

export const ARTICLE_TYPE_COLORS: Record<string, string> = {
  result: "bg-blue-50 text-blue-700 border-blue-200",
  match_report: "bg-blue-50 text-blue-700 border-blue-200",
  preview: "bg-orange-50 text-orange-700 border-orange-200",
  transfer: "bg-purple-50 text-purple-700 border-purple-200",
  player_profile: "bg-cyan-50 text-cyan-700 border-cyan-200",
  recap: "bg-emerald-50 text-emerald-700 border-emerald-200",
  guide: "bg-yellow-50 text-yellow-700 border-yellow-200",
  trending: "bg-pink-50 text-pink-700 border-pink-200",
  analysis: "bg-cyan-50 text-cyan-700 border-cyan-200",
  news: "bg-lime-50 text-lime-700 border-lime-200",
  streaming: "bg-red-50 text-red-700 border-red-200",
};

export function getArticleTypeLabel(type: string): string {
  return ARTICLE_TYPE_LABELS[type] || type;
}

export function getArticleTypeColor(type: string): string {
  return ARTICLE_TYPE_COLORS[type] || ARTICLE_TYPE_COLORS.news;
}
