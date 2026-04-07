import { timingSafeEqual } from "crypto";

/**
 * Verify CRON authentication using timing-safe comparison.
 * Prevents timing attacks on Bearer token validation.
 */
export function verifyCronAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) {
    // Fail closed: never allow if secret missing or too weak
    console.error("[auth] CRON_SECRET missing or too short — denying request");
    return false;
  }
  const authHeader = request.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  if (authHeader.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
}
