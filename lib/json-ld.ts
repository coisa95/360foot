/**
 * Safely serialize JSON-LD data for use in <script type="application/ld+json">.
 * Prevents XSS via </script> injection in data from the database.
 *
 * Guards:
 * - undefined/null input → "null" (JSON.stringify(undefined) returns undefined
 *   which would break the .replace() chain and surface as a crash in SSR)
 * - circular references → "null" with a console warn (prevents SSR throws)
 */
export function safeJsonLd(data: unknown): string {
  let json: string;
  try {
    json = JSON.stringify(data);
  } catch (e) {
    console.warn("[safeJsonLd] JSON.stringify failed:", e);
    return "null";
  }
  if (typeof json !== "string") return "null";
  return json.replace(/<\/script/gi, "<\\/script").replace(/<!--/g, "<\\!--");
}
