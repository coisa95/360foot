import { timingSafeEqual } from "crypto";

/**
 * Verify CRON authentication using timing-safe comparison.
 * Prevents timing attacks on Bearer token validation.
 */
export function verifyCronAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization") || "";
  const expected = `Bearer ${process.env.CRON_SECRET || ""}`;
  if (authHeader.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
}
