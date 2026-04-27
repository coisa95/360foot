/**
 * SEO helpers centralises — thin content detection.
 *
 * Objectif : éviter que Google indexe des pages "coquilles" (Équipe A vs
 * Équipe B sans stats, joueur sans statistiques, ligue sans classement) qui
 * polluent la Search Console en "Détectée non indexée" / "Explorée non
 * indexée" / Soft 404.
 *
 * Usage typique dans `generateMetadata` :
 *
 *   const robots = noindexIf(!hasRealData);
 *   return { title, description, robots, ... };
 *
 * `noindexIf` rend toujours `follow: true` — on veut que Google suive les
 * liens sortants (vers les pages riches) même depuis une page pauvre.
 *
 * Pour RÉACTIVER l'indexation d'une famille de pages (si la data s'enrichit),
 * il suffit d'ajuster ou supprimer le check côté appelant : la logique
 * métier reste centralisée ici.
 */

import type { Metadata } from "next";

type Robots = NonNullable<Metadata["robots"]>;

/**
 * Robots explicite "indexable + max snippets" — on l'émet sur les pages
 * dynamiques qui ont du contenu, pour que Google reçoive un signal positif
 * (et notamment `max-image-preview:large` qui est requis pour Discover et
 * les rich results).
 */
export const INDEXABLE_ROBOTS = {
  index: true,
  follow: true,
  "max-image-preview": "large" as const,
  "max-snippet": -1,
  "max-video-preview": -1,
} satisfies Robots;

/**
 * Renvoie `{ index: false, follow: true }` si `shouldNoindex` est true,
 * sinon le robots explicite indexable. Avant : retournait `undefined` (laissait
 * Next.js appliquer le défaut du layout) — ce qui n'émettait PAS de balise
 * `<meta name="robots">` sur la page, alors que Google préfère un signal
 * explicite.
 */
export function noindexIf(shouldNoindex: boolean): Robots {
  return shouldNoindex ? { index: false, follow: true } : INDEXABLE_ROBOTS;
}

// ── Helpers "a-t-on de la data ?" ─────────────────────────────────────────

/** Vrai si l'objet JSON n'est pas vide (ni null/undefined, ni {} ni []). */
export function hasJsonContent(value: unknown): boolean {
  if (value == null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value as object).length > 0;
  return false;
}

/** Match : finis → stats/events/lineups ; à venir → predictions/h2h. */
export function matchHasRealData(match: {
  status?: string | null;
  events_json?: unknown;
  lineups_json?: unknown;
  stats_json?: unknown;
  predictions_json?: unknown;
  h2h_json?: unknown;
}): boolean {
  const isFinished = match.status === "FT" || match.status === "AET" || match.status === "PEN";
  if (isFinished) {
    return (
      hasJsonContent(match.events_json) ||
      hasJsonContent(match.lineups_json) ||
      hasJsonContent(match.stats_json)
    );
  }
  return hasJsonContent(match.predictions_json) || hasJsonContent(match.h2h_json);
}

// ── Seuils de qualité ────────────────────────────────────────────────────

/** Nombre minimum d'articles pour qu'une page `/ligue/[slug]/actualites`
 *  soit indexable. En dessous, le contenu est jugé trop maigre. */
export const MIN_ARTICLES_FOR_INDEX = 3;

/** Nombre minimum de matchs (passés récents ou à venir) pour qu'une page
 *  sous-ligue (résultats, calendrier) soit indexable. */
export const MIN_MATCHES_FOR_INDEX = 1;
