import { test, expect } from "@playwright/test";

/**
 * Smoke test — /matchs + un match détail.
 */
test.describe("Matchs", () => {
  test("listing /matchs loads + first match detail renders", async ({
    page,
  }) => {
    const listResp = await page.goto("/matchs", {
      waitUntil: "domcontentloaded",
    });
    expect(listResp?.status()).toBe(200);

    // Il y a au moins un lien vers un match détail
    const matchLink = page
      .locator('a[href^="/match/"]')
      .filter({ hasNot: page.locator('[href="/matchs"]') })
      .first();

    // Cas pas de match aujourd'hui : la page existe mais aucun lien, on tolère.
    const count = await matchLink.count();
    test.skip(
      count === 0,
      "Aucun match listé sur /matchs — probablement journée off."
    );

    await expect(matchLink).toBeVisible();
    const href = await matchLink.getAttribute("href");
    const detailResp = await page.goto(href!, {
      waitUntil: "domcontentloaded",
    });
    expect(detailResp?.status()).toBe(200);

    // Signal minimal qu'on est sur une fiche de match : un titre <h1>
    await expect(page.locator("h1").first()).toBeVisible();
  });
});
