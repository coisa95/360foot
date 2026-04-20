/**
 * SKIPPED — integration test for /api/syndication/articles.
 *
 * What it would do: import the route handler directly, call it with a
 * Request that has no x-api-key (expect 401) and then with a valid
 * key (expect 200 + a list of articles).
 *
 * Why it's skipped in the smoke layer:
 *
 *   - The handler calls `createClient()` from `@/lib/supabase`, which
 *     reads SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY from the env and
 *     opens a real Postgres connection.  Testing the 200 path would
 *     require either a live DB (not pure) or a full Supabase mock
 *     (more plumbing than a "smoke" layer deserves).
 *
 *   - The 401 path IS tested indirectly — `syndication-auth.test.ts`
 *     proves `verifySyndicationApiKey` returns false when env is
 *     missing / header is wrong, and we can see in the route source
 *     that it calls `verifyApiKey(request)` first thing and returns
 *     401 on false.  Good enough for smoke.
 *
 * Upgrade path: promote this to a real integration test once we add
 * a Supabase test harness (e.g. pg-mem or a dedicated test schema).
 */
import { describe, it } from "vitest";

describe.skip("/api/syndication/articles route handler (requires Supabase mock)", () => {
  it("returns 401 without x-api-key", () => {});
  it("returns 200 with a valid x-api-key", () => {});
});
