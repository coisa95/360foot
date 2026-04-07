import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get("host") || "";

  // 301 www.360-foot.com -> 360-foot.com (canonical apex)
  if (host.startsWith("www.")) {
    url.host = host.slice(4);
    return NextResponse.redirect(url, 301);
  }

  const response = NextResponse.next();
  const { pathname, searchParams } = request.nextUrl;

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
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https: data:",
      "font-src 'self' data:",
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
