/**
 * Safely serialize JSON-LD data for use in <script type="application/ld+json">.
 * Prevents XSS via </script> injection in data from the database.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/<\/script/gi, "<\\/script")
    .replace(/<!--/g, "<\\!--");
}
