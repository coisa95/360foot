import { test, expect } from "@playwright/test";

/**
 * Smoke test — /recherche.
 *
 * Régression cible : les accents Unicode ne doivent pas faire 400 côté API.
 * Ex : "mbappé" → la page rend, et l'appel API sous-jacent ne renvoie pas 400.
 */
test.describe("Recherche", () => {
  test("page loads with a search form", async ({ page }) => {
    const resp = await page.goto("/recherche", {
      waitUntil: "domcontentloaded",
    });
    expect(resp?.status()).toBe(200);

    // Un input de type texte/search
    const input = page.locator('input[type="search"], input[type="text"]').first();
    await expect(input).toBeVisible();
  });

  test("accented query does not trigger a 400", async ({ page, request }) => {
    // Soit la page prend q= en query param, soit elle fait une fetch côté client.
    // On teste les deux : page.goto + surveillance réseau.
    const badResponses: { url: string; status: number }[] = [];
    page.on("response", (r) => {
      if (r.status() === 400) {
        badResponses.push({ url: r.url(), status: 400 });
      }
    });

    const resp = await page.goto("/recherche?q=mbapp%C3%A9", {
      waitUntil: "domcontentloaded",
    });
    expect(resp?.status()).toBe(200);

    // On attend qu'une éventuelle fetch client ait eu le temps de partir.
    await page.waitForTimeout(1500);

    expect(
      badResponses,
      `Got 400s: ${badResponses.map((r) => r.url).join(", ")}`
    ).toEqual([]);

    // Sanity supplémentaire : appel direct API si elle existe.
    const apiResp = await request.get("/api/search?q=mbapp%C3%A9");
    // La route peut répondre 200/404/405 selon implémentation — le seul échec
    // interdit c'est 400 (bad request à cause du UTF-8).
    expect(apiResp.status()).not.toBe(400);
  });
});
