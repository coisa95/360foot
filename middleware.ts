import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const { pathname, searchParams } = request.nextUrl;

  // 301 www.360-foot.com -> 360-foot.com (canonical apex).
  // On reconstruit une URL absolue propre pour éviter de fuiter le port
  // interne du container (ex: 3000) quand next.js clone l'URL.
  if (host.startsWith("www.")) {
    const apexHost = host.slice(4);
    const qs = searchParams.toString();
    const target = `https://${apexHost}${pathname}${qs ? `?${qs}` : ""}`;
    return NextResponse.redirect(target, 301);
  }

  // vip.360-foot.com → landing page statique /vip/index.html
  // Tous les assets (coupons, logos) sont sous /vip/*.
  const isVipHost = host === "vip.360-foot.com" || host.startsWith("vip.360-foot.com:");
  if (isVipHost) {
    const url = request.nextUrl.clone();
    if (pathname === "/" || pathname === "") {
      url.pathname = "/vip/index.html";
    } else if (!pathname.startsWith("/vip/") && !pathname.startsWith("/_next/")) {
      url.pathname = `/vip${pathname}`;
    }
    const vipResponse = NextResponse.rewrite(url);
    vipResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
    vipResponse.headers.set("X-Content-Type-Options", "nosniff");
    vipResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    return vipResponse;
  }

  const response = NextResponse.next();

  // Noindex for parameter-driven pages (prevent duplicate indexing)
  const hasQueryParams = searchParams.toString().length > 0;
  const paramPages = ["/matchs", "/actu"];
  const paramPrefixes = ["/ligue/"];
  if (
    hasQueryParams &&
    (paramPages.some((p) => pathname === p) ||
      paramPrefixes.some((p) => pathname.startsWith(p)))
  ) {
    response.headers.set("X-Robots-Tag", "noindex, follow");
  }

  // Note : le Cache-Control des pages publiques est géré dans next.config.mjs
  // (async headers()) car le middleware peut être écrasé par Next.js au moment
  // du rendu dynamique (pages utilisant searchParams).

  // Security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  // CSP : plus aucune dépendance Vercel. GA/GTM conservés (analytics principal).
  // 'unsafe-inline' encore nécessaire pour Next.js (inline hydration scripts) —
  // migration vers nonce-based CSP prévue dans une prochaine itération.
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' https: data:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://region1.google-analytics.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "worker-src 'self' blob:",
      "upgrade-insecure-requests",
    ].join("; ")
  );

  return response;
}

export const config = {
  matcher: [
    // Apply to all routes except static files and api
    "/((?!_next/static|_next/image|favicon.ico|icon-512.png|logo.png|images/).*)",
  ],
};
