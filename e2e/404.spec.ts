import { test, expect } from "@playwright/test";

/**
 * Smoke test — 404 handling.
 *
 * On veut :
 *  - une page qui n'existe vraiment pas renvoie un vrai HTTP 404 (pas soft-200)
 *  - la UI contient "Page introuvable" (cf. app/not-found.tsx)
 *
 * Le soft-404 (page dynamique existante qui devrait 404 mais renvoie 200)
 * est un bug connu sur les routes /[slug] — on le laisse en test.fixme en
 * attendant le fix.
 */
test.describe("404", () => {
  test("hard 404 on /this-does-not-exist-xyz-123", async ({ page }) => {
    const response = await page.goto("/this-does-not-exist-xyz-123", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBe(404);
    await expect(page.getByText(/page introuvable/i)).toBeVisible();
  });

  // Soft-404 known bug : slug inexistant sur une route dynamique renvoie 200
  // au lieu de 404. Remplace le fixme par test() une fois le fix déployé.
  test.fixme(
    "soft-404 on dynamic route returns proper 404",
    async ({ page }) => {
      const response = await page.goto(
        "/equipe/this-team-definitely-does-not-exist-xyz-123",
        {
          waitUntil: "domcontentloaded",
        }
      );
      expect(response?.status()).toBe(404);
    }
  );
});
