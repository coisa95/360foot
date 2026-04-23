import { test, expect } from "@playwright/test";

/**
 * Smoke test — home page `/`.
 *
 * Règles :
 *  - charge en moins de 3s (perf gatekeeper)
 *  - <title> contient "360"
 *  - lien vers /actu présent
 *  - aucune erreur console (hors 3rd-party connus)
 */
test.describe("Home /", () => {
  test("loads under 3s, has 360 in title, links to /actu, no console errors", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        // Ignore bruit 3rd-party connu
        if (
          text.includes("favicon.ico") ||
          text.includes("Failed to load resource") ||
          text.includes("google-analytics") ||
          text.includes("gtag")
        ) {
          return;
        }
        consoleErrors.push(text);
      }
    });

    const start = Date.now();
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    const loadMs = Date.now() - start;

    expect(response?.status()).toBe(200);
    expect(loadMs).toBeLessThan(3000);

    await expect(page).toHaveTitle(/360/i);

    // Il existe au moins un lien vers /actu (header ou nav)
    const actuLink = page.locator('a[href^="/actu"]').first();
    await expect(actuLink).toBeVisible();

    expect(consoleErrors, `Console errors: ${consoleErrors.join("\n")}`).toEqual(
      []
    );
  });
});
