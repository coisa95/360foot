/**
 * Extract the real client IP behind Cloudflare / Traefik.
 *
 * Priority:
 * 1. CF-Connecting-IP — set by Cloudflare, unforgeable (only CF can set it
 *    when traffic enters through their network; we should strip it at edge
 *    for any origin not behind CF, which is already the case for 360-foot.com).
 * 2. X-Real-IP — set by Traefik forwardedHeaders.trustedIPs.
 * 3. First entry of X-Forwarded-For.
 */
export function getClientIp(request: Request): string {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return "unknown";
}

/**
 * Extract country. Cloudflare adds CF-IPCountry; keep Vercel header as
 * legacy fallback during transition.
 */
export function getClientCountry(request: Request): string {
  return (
    request.headers.get("cf-ipcountry") ||
    request.headers.get("x-vercel-ip-country") ||
    "unknown"
  );
}

/**
 * Escape characters that carry semantic meaning in a Postgres LIKE/ILIKE
 * pattern so a user query cannot inject wildcards or DoS the DB with
 * unbounded partial matches.
 */
export function escapeLikePattern(input: string): string {
  return input.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}
