/**
 * POST /api/log-error
 *
 * Collects client-side / SSR React crashes routed via app/global-error.tsx.
 * Without this, unhandled errors died silently — we only knew about the
 * pronostic crash by grepping docker logs manually.
 *
 * Stores the last N errors in Redis (if configured) for dashboard lookup,
 * and always echoes to stderr so docker logs picks it up.
 */
import { NextResponse } from "next/server";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type ErrorPayload = {
  message?: string;
  digest?: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
};

// Simple in-memory rate limit (per-container) so a crashing client doesn't
// hammer us. 50 errors / 60s / IP max.
const rlBuckets = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(ip: string) {
  const now = Date.now();
  const b = rlBuckets.get(ip);
  if (!b || b.resetAt < now) {
    rlBuckets.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  b.count++;
  return b.count > 50;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ ok: false, reason: "rate_limit" }, { status: 429 });
  }

  let body: ErrorPayload = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_json" }, { status: 400 });
  }

  // Clip sizes — a malicious client shouldn't flood our logs.
  const clip = (s: string | undefined, n: number) =>
    typeof s === "string" ? s.slice(0, n) : undefined;
  const safe = {
    message: clip(body.message, 500),
    digest: clip(body.digest, 50),
    stack: clip(body.stack, 4000),
    url: clip(body.url, 500),
    userAgent: clip(body.userAgent, 300),
    timestamp: body.timestamp || new Date().toISOString(),
    ip,
  };

  // Always write to stderr — docker logs -> Coolify UI captures it.
  // Prefix so it's greppable.
  console.error("[CLIENT_ERROR]", JSON.stringify(safe));

  // Best-effort Telegram alert. Env vars already used elsewhere in the
  // stack (workers) — same bot/channel reuse. Swallow errors: logging
  // must never fail the user-facing request.
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const channelId =
    process.env.TELEGRAM_ERROR_CHANNEL_ID || process.env.TELEGRAM_CHANNEL_ID;
  if (botToken && channelId) {
    const urlShort = safe.url?.replace("https://360-foot.com", "") || "?";
    const msg =
      `🚨 *360foot* error\n` +
      `\`${urlShort}\`\n` +
      `*msg*: ${safe.message || "?"}\n` +
      `*digest*: \`${safe.digest || "?"}\`\n` +
      `*ip*: \`${ip}\``;
    // Fire-and-forget; 3s timeout so we don't hang the request thread.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: channelId,
        text: msg,
        parse_mode: "Markdown",
        disable_notification: false,
      }),
      signal: ctrl.signal,
    })
      .catch(() => {
        /* swallow — logging already on stderr */
      })
      .finally(() => clearTimeout(timer));
  }

  return NextResponse.json({ ok: true });
}
