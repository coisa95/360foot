import { test, expect } from "@playwright/test";

/**
 * Smoke test — /api/health.
 *
 * Contract :
 *  - 200 avec { status: "ok", timestamp: ISO string }
 *  - la réponse publique NE contient PAS tokenUsage / spend / uptime (les
 *    infos détaillées sont derrière ?full=1 + x-internal-key).
 */
test.describe("GET /api/health", () => {
  test("returns 200 with minimal ok payload", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toMatchObject({ status: "ok" });
    expect(typeof body.timestamp).toBe("string");
    expect(() => new Date(body.timestamp).toISOString()).not.toThrow();
  });

  test("public response does NOT leak tokenUsage / claude / spend", async ({
    request,
  }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const raw = await res.text();

    // Aucune mention des infos sensibles dans la réponse publique.
    expect(raw.toLowerCase()).not.toContain("tokenusage");
    expect(raw).not.toContain("estimatedSpendUSD");
    expect(raw).not.toContain("inputTokens");
    expect(raw).not.toContain("outputTokens");
    expect(raw).not.toContain("cacheReadTokens");
  });
});
