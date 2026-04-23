import { test, expect } from "@playwright/test";

/**
 * Regression test — visiter N pronostics réels récents depuis le sitemap et
 * vérifier :
 *  - aucune erreur console "Objects are not valid as a React child"
 *  - aucune trace du bug "{for, against}" (objet stringifié dans le DOM)
 *  - aucune marque NEXT_NOT_FOUND côté client sur une URL qui devrait rendre
 *
 * On vise 5 pronostics pour garder le temps d'exécution sous 1 min.
 */
const SAMPLE_SIZE = 5;

test.describe("Crash regression — pronostics sitemap sample", () => {
  test("5 recent pronostics render cleanly", async ({ page, request }) => {
    // 1. Charger le sitemap des pronostics et en extraire les URLs.
    const sitemapRes = await request.get("/sitemap-pronostics.xml");
    expect(sitemapRes.status()).toBe(200);
    const xml = await sitemapRes.text();

    const urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g))
      .map((m) => m[1])
      .filter((u) => u.includes("/pronostic/"))
      .slice(0, SAMPLE_SIZE);

    test.skip(
      urls.length === 0,
      "sitemap-pronostics.xml vide — rien à tester."
    );

    expect(urls.length).toBeGreaterThan(0);

    // 2. Pour chaque URL, visiter et collecter les erreurs.
    const failures: string[] = [];

    for (const fullUrl of urls) {
      // Normaliser : si baseURL = localhost, on remappe le path.
      const path = new URL(fullUrl).pathname;

      const reactErrors: string[] = [];
      const onConsole = (msg: import("@playwright/test").ConsoleMessage) => {
        if (msg.type() === "error") {
          const t = msg.text();
          if (
            t.includes("Objects are not valid as a React child") ||
            t.includes('"for"') && t.includes('"against"')
          ) {
            reactErrors.push(t);
          }
        }
      };
      const onPageError = (err: Error) => {
        if (
          err.message.includes("Objects are not valid as a React child") ||
          (err.message.includes('"for"') && err.message.includes('"against"'))
        ) {
          reactErrors.push(err.message);
        }
      };
      page.on("console", onConsole);
      page.on("pageerror", onPageError);

      const resp = await page.goto(path, { waitUntil: "domcontentloaded" });
      const status = resp?.status() ?? 0;

      // Si 404, ça veut dire que l'URL du sitemap est stale — on saute.
      if (status === 404) {
        page.off("console", onConsole);
        page.off("pageerror", onPageError);
        continue;
      }

      if (status !== 200) {
        failures.push(`${path} — HTTP ${status}`);
      }

      const body = await page.locator("body").innerText();

      if (body.includes("Objects are not valid as a React child")) {
        failures.push(`${path} — React crash text in body`);
      }

      // Pattern du bug {for, against} stringifié dans le DOM.
      if (/\{[^}]*"for"[^}]*"against"[^}]*\}/.test(body)) {
        failures.push(`${path} — {for, against} object leaked into DOM`);
      }

      // NEXT_NOT_FOUND signal côté client alors que HTTP a renvoyé 200.
      const html = await page.content();
      if (html.includes("NEXT_NOT_FOUND") && status === 200) {
        failures.push(`${path} — NEXT_NOT_FOUND in HTML on 200 response`);
      }

      if (reactErrors.length > 0) {
        failures.push(`${path} — React errors: ${reactErrors.join(" | ")}`);
      }

      page.off("console", onConsole);
      page.off("pageerror", onPageError);
    }

    expect(failures, `Failures on sample:\n${failures.join("\n")}`).toEqual([]);
  });
});
