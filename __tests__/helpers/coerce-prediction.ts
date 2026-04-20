/**
 * Pure, test-only duplicate of the winner/goals normalisation logic that
 * lives inline in `app/api/cron/enrich-previews/route.ts`.
 *
 * Why duplicate?  The production logic is embedded inside a long handler
 * (DB calls, rate limiting, etc.) — extracting it would be more invasive
 * than this smoke layer deserves.  This helper documents the contract
 * and lets us regression-test the bug that crashed the pronostic pages
 * in prod (API-Football returned `{ id, name, comment }` where we
 * expected a string, and React tried to render the object).
 *
 * IMPORTANT: if the inline logic in route.ts changes, update this too —
 * these functions must stay byte-for-byte equivalent.
 */

export function coerceWinnerName(rawWinner: unknown): string | null {
  return typeof rawWinner === "string"
    ? rawWinner
    : rawWinner && typeof rawWinner === "object"
      ? (rawWinner as { name?: string }).name || null
      : null;
}

export function coerceWinnerComment(rawWinner: unknown): string | null {
  return rawWinner && typeof rawWinner === "object"
    ? (rawWinner as { comment?: string }).comment || null
    : null;
}

export function coerceGoals(rawGoals: unknown): string | null {
  if (typeof rawGoals === "string") return rawGoals;
  if (
    rawGoals &&
    typeof rawGoals === "object" &&
    (rawGoals as { home?: unknown }).home != null
  ) {
    const g = rawGoals as { home?: unknown; away?: unknown };
    return `${g.home} - ${g.away}`;
  }
  return null;
}
