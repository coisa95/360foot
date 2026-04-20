/**
 * Shape of `matches.predictions_json` AFTER cron/enrich-previews normalizes
 * the raw API-Football payload.
 *
 * Why this exists:
 *   The API-Football response has `winner` as `{id, name, comment}` and
 *   `goals` as `{home, away}`. Rendering those directly in JSX crashes
 *   React with "Objects are not valid as a React child". enrich-previews
 *   coerces them to strings at write-time so the render layer can assume
 *   primitives everywhere.
 *
 * Render code SHOULD import this type instead of using `any` on
 * `predictions_json`. If you add a new field to enrich-previews, add
 * it here too.
 *
 * Legacy data in the DB may still have the old object shape for
 * `winner`/`goals`. Render code MUST still handle both shapes defensively
 * (see pronostic/match pages) until a backfill migration lands.
 */
export interface NormalizedPrediction {
  /** Team name of the predicted winner, or null. */
  winner: string | null;
  /** Comment from API-Football (e.g. "Win or draw"), or null. */
  winner_comment: string | null;
  /** Human-readable advice. */
  advice: string;
  /** Win probability percentages as display strings e.g. { home: "45%" }. */
  percent: {
    home?: string;
    draw?: string;
    away?: string;
  };
  /** Expected goals display string e.g. "-1.5 - -1.5", or null. */
  goals: string | null;
  /** Over/under threshold string e.g. "-3.5", or null. */
  under_over: string | null;
  /**
   * Stat-by-stat comparison. Values are usually strings like "50%",
   * but defensive rendering is still required because API-Football
   * occasionally returns nested objects for specific leagues.
   */
  comparison: Record<string, { home: unknown; away: unknown }>;
  /** Last 5 matches form string, e.g. "WDLWW". */
  home_form: string;
  away_form: string;
  /** Last-5 goals stats from API-Football (left as-is, defensively rendered). */
  home_goals_last5: unknown;
  away_goals_last5: unknown;
}

/**
 * Type guard to detect legacy non-normalized data (winner still an object).
 * Used in render code to stay backwards-compatible with old rows.
 */
export function isLegacyWinnerObject(
  winner: unknown,
): winner is { name?: string; comment?: string } {
  return !!winner && typeof winner === "object" && !Array.isArray(winner);
}
