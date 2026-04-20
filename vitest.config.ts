import { defineConfig } from "vitest/config";
import path from "path";

/**
 * Minimal Vitest config — smoke tests only.
 *
 * `environment: "node"` because every test here exercises server-side
 * code (API route helpers, pure utils). No jsdom needed — component
 * rendering tests are out of scope for this layer.
 *
 * `resolve.alias` mirrors tsconfig.json `paths` so `@/lib/...` imports
 * work the same way in tests as in the Next.js build.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
    // The legacy african-sources.test.ts uses Jest-style globals
    // (describe/it/expect) — enable globals so it keeps working.
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
