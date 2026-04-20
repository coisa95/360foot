/**
 * Shared API key verification for /api/syndication/* routes.
 *
 * Uses crypto.timingSafeEqual to prevent timing-based key discovery
 * attacks (comparing `a === b` on strings leaks information about how
 * many bytes match via nanosecond differences).
 */
import { timingSafeEqual } from "crypto";

export function verifySyndicationApiKey(request: Request): boolean {
  const provided = request.headers.get("x-api-key");
  const expected = process.env.SYNDICATION_API_KEY;

  // Fail closed: if the env var is missing the API is broken — better
  // to 401 than to silently accept an empty key.
  if (!expected || typeof provided !== "string") return false;

  // timingSafeEqual requires equal length buffers. Pad or truncate?
  // Neither — length mismatch is a fast reject. That's fine because
  // the expected key has a fixed length (hex-64 in our setup), so a
  // wrong-length guess is not "close to correct" anyway.
  if (provided.length !== expected.length) return false;

  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  } catch {
    return false;
  }
}
