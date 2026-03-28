import cron from "node-cron";

// ============================================
// 360 Foot — CRON Worker for Render
// Triggers Vercel API routes on schedule
// ============================================

const SITE_URL = process.env.SITE_URL || "https://360-foot.com";
const CRON_SECRET = process.env.CRON_SECRET || "";

function log(level: "INFO" | "OK" | "ERROR", message: string) {
  const ts = new Date().toISOString();
  const icon = level === "OK" ? "✅" : level === "ERROR" ? "❌" : "🔄";
  console.log(`[${ts}] ${icon} ${message}`);
}

async function triggerJob(path: string): Promise<void> {
  const url = `${SITE_URL}${path}`;
  log("INFO", `Triggering ${path}...`);

  try {
    const headers: Record<string, string> = {};
    if (CRON_SECRET) {
      headers["Authorization"] = `Bearer ${CRON_SECRET}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300_000); // 5 min timeout

    const res = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (res.ok) {
      const body = await res.text().catch(() => "");
      log("OK", `${path} → ${res.status} (${body.slice(0, 100)})`);
    } else {
      log("ERROR", `${path} → ${res.status} ${res.statusText}`);
    }
  } catch (err) {
    log("ERROR", `${path} → ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ============================================
// CRON SCHEDULES (same as vercel.json)
// ============================================

// Every hour at :00 — Collect matches from API-Football
cron.schedule("0 * * * *", () => triggerJob("/api/cron/collect-matches"));

// Every hour at :10 — Generate result articles
cron.schedule("10 * * * *", () => triggerJob("/api/cron/generate-articles"));

// Every hour at :20 — Generate preview articles
cron.schedule("20 * * * *", () => triggerJob("/api/cron/generate-previews"));

// Every 20 min — Enrich finished matches with events/stats
cron.schedule("*/20 * * * *", () => triggerJob("/api/cron/enrich-matches"));

// Every hour at :40 — Enrich upcoming matches with predictions
cron.schedule("40 * * * *", () => triggerJob("/api/cron/enrich-previews"));

// Every hour at :30 — Update league standings
cron.schedule("30 * * * *", () => triggerJob("/api/cron/update-standings"));

// Daily at 06:00 — Fetch top players stats
cron.schedule("0 6 * * *", () => triggerJob("/api/cron/fetch-top-players"));

// Daily at 05:00 — Fetch team statistics
cron.schedule("0 5 * * *", () => triggerJob("/api/cron/fetch-team-stats"));

// Daily at 03:00 — Regenerate sitemap
cron.schedule("0 3 * * *", () => triggerJob("/api/cron/generate-sitemap"));

// Every hour at :50 — Process RSS feeds
cron.schedule("50 * * * *", () => triggerJob("/api/cron/process-rss"));

// 3x daily — Populate players from API-Football squads
cron.schedule("0 4,12,20 * * *", () => triggerJob("/api/cron/populate-players"));

// 3x daily — Enrich players with career stats
cron.schedule("0 5,13,21 * * *", () => triggerJob("/api/cron/enrich-players"));

// ============================================
// STARTUP
// ============================================

log("INFO", "=== 360 Foot CRON Worker started ===");
log("INFO", `Target: ${SITE_URL}`);
log("INFO", "12 CRON jobs scheduled:");
log("INFO", "  - collect-matches     → 0 * * * *");
log("INFO", "  - generate-articles   → 10 * * * *");
log("INFO", "  - generate-previews   → 20 * * * *");
log("INFO", "  - enrich-matches      → */20 * * * *");
log("INFO", "  - enrich-previews     → 40 * * * *");
log("INFO", "  - update-standings    → 30 * * * *");
log("INFO", "  - fetch-top-players   → 0 6 * * *");
log("INFO", "  - fetch-team-stats    → 0 5 * * *");
log("INFO", "  - generate-sitemap    → 0 3 * * *");
log("INFO", "  - process-rss         → 50 * * * *");
log("INFO", "  - populate-players    → 0 4,12,20 * * *");
log("INFO", "  - enrich-players      → 0 5,13,21 * * *");
log("INFO", "Worker running... Press Ctrl+C to stop.");

// Keep process alive
process.on("SIGTERM", () => {
  log("INFO", "SIGTERM received, shutting down...");
  process.exit(0);
});

process.on("SIGINT", () => {
  log("INFO", "SIGINT received, shutting down...");
  process.exit(0);
});
