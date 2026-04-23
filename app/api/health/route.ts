import { NextResponse } from "next/server";
import { createAnonClient } from "@/lib/supabase";
import { tokenUsage, getEstimatedSpendUSD } from "@/lib/claude";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Health endpoint — used by:
 *  - Coolify (HEALTHCHECK in Dockerfile)
 *  - Cloudflare health monitor
 *  - healthchecks.io uptime monitor (call every 5min from outside)
 *
 * Checks:
 *  - DB round-trip (SELECT 1 via PostgREST)
 *  - Exposes uptime + Claude token usage (degraded if >$X/day)
 *
 * Returns:
 *  - 200 { status: "ok", ...details } when healthy
 *  - 503 { status: "degraded", ...details } when DB down
 *
 * Public response only carries { status, timestamp }. Detailed metrics
 * (db latency, Claude token usage, spend estimate) require `?full=1` +
 * `x-internal-key` header matching process.env.INTERNAL_OPS_KEY.
 */
export async function GET(request: Request) {
  const start = Date.now();
  let dbOk = false;
  let dbLatencyMs = 0;
  let dbError: string | null = null;

  try {
    const supabase = createAnonClient();
    const t0 = Date.now();
    const { error } = await supabase
      .from("leagues")
      .select("id", { count: "exact", head: true })
      .limit(1);
    dbLatencyMs = Date.now() - t0;
    if (error) {
      dbError = error.message;
    } else {
      dbOk = true;
    }
  } catch (e) {
    dbError = e instanceof Error ? e.message : "unknown";
  }

  const url = new URL(request.url);
  const wantsFull = url.searchParams.get("full") === "1";
  const providedKey = request.headers.get("x-internal-key");
  const expectedKey = process.env.INTERNAL_OPS_KEY;
  const authorized =
    wantsFull && !!expectedKey && providedKey === expectedKey;

  if (!authorized) {
    // Minimal public response — no business info leak.
    return NextResponse.json(
      {
        status: dbOk ? "ok" : "degraded",
        timestamp: new Date().toISOString(),
      },
      {
        status: dbOk ? 200 : 503,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }

  const body = {
    status: dbOk ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptimeSec: Math.round(process.uptime()),
    db: {
      ok: dbOk,
      latencyMs: dbLatencyMs,
      error: dbError,
    },
    claude: {
      calls: tokenUsage.calls,
      inputTokens: tokenUsage.input,
      outputTokens: tokenUsage.output,
      cacheReadTokens: tokenUsage.cacheRead,
      estimatedSpendUSD: Number(getEstimatedSpendUSD().toFixed(4)),
    },
    responseMs: Date.now() - start,
  };

  return NextResponse.json(body, {
    status: dbOk ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
