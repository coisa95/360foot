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
};

export const ARTICLE_TYPE_COLORS: Record<string, string> = {
  result: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  match_report: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  preview: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  transfer: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  player_profile: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  recap: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  guide: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  trending: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  analysis: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  news: "bg-lime-500/20 text-lime-400 border-lime-500/30",
};

export function getArticleTypeLabel(type: string): string {
  return ARTICLE_TYPE_LABELS[type] || type;
}

export function getArticleTypeColor(type: string): string {
  return ARTICLE_TYPE_COLORS[type] || ARTICLE_TYPE_COLORS.news;
}
