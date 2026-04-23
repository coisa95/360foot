import { test, expect } from "@playwright/test";

/**
 * Smoke test — /api/syndication/articles.
 *
 * Auth : header x-api-key obligatoire.
 *
 * La vraie clé est passée via E2E_SYNDICATION_KEY (jamais en dur dans le repo).
 * Si la var n'est pas set, le test "happy path" est skipped.
 */
const SYNDICATION_KEY = process.env.E2E_SYNDICATION_KEY;

test.describe("GET /api/syndication/articles", () => {
  test("returns 401 without api key", async ({ request }) => {
    const res = await request.get("/api/syndication/articles");
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  test("returns 401 with wrong api key", async ({ request }) => {
    const res = await request.get("/api/syndication/articles", {
      headers: { "x-api-key": "wrong-key-nope" },
    });
    expect(res.status()).toBe(401);
  });

  test("returns 200 + non-empty articles with valid key", async ({
    request,
  }) => {
    test.skip(
      !SYNDICATION_KEY,
      "E2E_SYNDICATION_KEY non set — skip du happy path."
    );

    const res = await request.get("/api/syndication/articles?limit=5", {
      headers: { "x-api-key": SYNDICATION_KEY! },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("articles");
    expect(Array.isArray(body.articles)).toBe(true);
    expect(body.articles.length).toBeGreaterThan(0);

    // Sanity check du shape d'un article
    const first = body.articles[0];
    expect(first).toHaveProperty("slug");
    expect(first).toHaveProperty("title");
    expect(first).toHaveProperty("canonical_url");
  });
});
