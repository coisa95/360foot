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

  // Cache-control override for public GET pages.
  // Certaines pages (/actu, /matchs, ...) utilisent searchParams et Next.js
  // force alors `private, no-cache, no-store`, ce qui empêche tout cache edge.
  // Comme ces pages sont 100% publiques (aucune session/cookie utilisateur),
  // on réécrit le header pour activer le cache partagé Cloudflare.
  const isPublicGet =
    request.method === "GET" &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/go/"); // /go/ = redirection affiliée, ne pas cacher (tracking)
  if (isPublicGet) {
    // Pages à faible fréquence d'update : cache plus long
    const longTtlPrefixes = ["/bookmakers", "/bons-plans", "/methodologie", "/confidentialite", "/mentions-legales", "/selection"];
    const isLongTtl = longTtlPrefixes.some((p) => pathname === p || pathname.startsWith(p));
    // Pages très fraîches : news, scores, classements
    const shortTtl = "public, s-maxage=300, stale-while-revalidate=86400";
    const longTtl = "public, s-maxage=21600, stale-while-revalidate=604800";
    response.headers.set("Cache-Control", isLongTtl ? longTtl : shortTtl);
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
