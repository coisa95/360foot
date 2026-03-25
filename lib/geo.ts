/**
 * Get the country code from Vercel's geolocation headers.
 * @param headers - The request Headers object
 * @returns ISO 3166-1 alpha-2 country code, or "DEFAULT" if not available
 */
export function getCountry(headers: Headers): string {
  return headers.get("x-vercel-ip-country") || "DEFAULT";
}
