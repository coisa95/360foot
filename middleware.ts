import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname, searchParams } = request.nextUrl;

  // Noindex for parameter-driven pages (prevent duplicate indexing)
  const hasQueryParams = searchParams.toString().length > 0;
  const paramPages = ["/matchs", "/actu"];
  if (hasQueryParams && paramPages.some((p) => pathname === p)) {
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
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self'; connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://vitals.vercel-insights.com; frame-ancestors 'none';"
  );

  return response;
}

export const config = {
  matcher: [
    // Apply to all routes except static files and api
    "/((?!_next/static|_next/image|favicon.ico|icon-512.png|logo.png|images/).*)",
  ],
};
