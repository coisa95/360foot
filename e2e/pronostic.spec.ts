import { test, expect } from "@playwright/test";

/**
 * Smoke test — /pronostic (index + un détail).
 *
 * Régression cible : le bug `{for, against}` qui renvoyait un objet React en
 * child. On vérifie qu'aucun message "Objects are not valid as a React child"
 * n'apparaît ni dans le DOM rendu, ni dans la console.
 */
test.describe("Pronostics", () => {
  test("index loads + first detail renders without React crash", async ({
    page,
  }) => {
    const reactErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const t = msg.text();
        if (
          t.includes("Objects are not valid as a React child") ||
          t.includes("Minified React error")
        ) {
          reactErrors.push(t);
        }
      }
    });
    page.on("pageerror", (err) => {
      if (err.message.includes("Objects are not valid as a React child")) {
        reactErrors.push(err.message);
      }
    });

    // 1. Index
    const indexResp = await page.goto("/pronostic", {
      waitUntil: "domcontentloaded",
    });
    expect(indexResp?.status()).toBe(200);

    // Au moins un lien /pronostic/<slug> dans la liste
    const firstLink = page
      .locator('a[href^="/pronostic/"]')
      .filter({ hasNot: page.locator('[href="/pronostic"]') })
      .first();
    await expect(firstLink).toBeVisible({ timeout: 15_000 });

    // 2. Détail
    const href = await firstLink.getAttribute("href");
    expect(href).toBeTruthy();

    const detailResp = await page.goto(href!, {
      waitUntil: "domcontentloaded",
    });
    expect(detailResp?.status()).toBe(200);

    // Attente d'un signal "la page pronostic a rendu quelque chose de sensé".
    // Soit le vainqueur est affiché, soit le message "Pronostic bientôt".
    const bodyText = await page.locator("body").innerText();
    expect(
      /vainqueur probable|pronostic bientôt|pronostic à venir/i.test(bodyText),
      `Ni "Vainqueur probable" ni "Pronostic bientôt" trouvé dans le body.`
    ).toBe(true);

    // Aucune trace du bug {for, against}
    expect(bodyText).not.toContain("Objects are not valid as a React child");
    expect(bodyText).not.toMatch(/\{[^}]*"for"[^}]*"against"[^}]*\}/);

    expect(reactErrors, `React errors captured: ${reactErrors.join("\n")}`).toEqual(
      []
    );
  });
});
