import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config — tests E2E smoke contre la prod déployée.
 *
 * Par défaut : https://360-foot.com
 * Override : E2E_BASE_URL=http://localhost:3000 npm run test:e2e
 *
 * Pas de webServer : on teste contre l'instance déjà déployée. Si on voulait
 * booter Next localement, on ajouterait un bloc `webServer` ici.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL || "https://360-foot.com",
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    // User-agent distinctif pour repérer les hits e2e dans les logs prod.
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 360foot-e2e",
    extraHTTPHeaders: {
      "x-e2e-test": "1",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
