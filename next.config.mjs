/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  // Standalone output : génère un bundle minimal pour Docker (~150MB au lieu de ~1GB)
  // Cf. https://nextjs.org/docs/pages/api-reference/next-config-js/output
  output: "standalone",
  experimental: {
    // Tree-shake agressivement les imports "barrel" des libs courantes.
    // Gain typique : -30 à -50% sur le JS client des pages qui importent
    // juste une icône ou un util.
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "@radix-ui/react-icons",
    ],
  },
  // Retire le header "X-Powered-By: Next.js" qui leak la version framework.
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  async headers() {
    // Next.js 15 marque dynamiques les pages utilisant searchParams et émet
    // `private, no-cache, no-store`, ce qui empêche le cache edge Cloudflare.
    // Comme 360-foot.com n'a aucune session ni contenu personnalisé, on
    // réécrit Cache-Control au niveau HTTP (plus fort que middleware, qui
    // peut être écrasé par le rendu Next.js).
    const shortTtl = "public, s-maxage=300, stale-while-revalidate=86400";
    const longTtl = "public, s-maxage=21600, stale-while-revalidate=604800";
    return [
      // Pages très fraîches : actu, matchs, scores, classements
      {
        source: "/((?!api|go|_next|favicon.ico|icon-512.png|logo.png|images|sitemap|robots).*)",
        headers: [{ key: "Cache-Control", value: shortTtl }],
      },
      // Pages peu mouvantes : override avec TTL plus long
      {
        source: "/bookmakers/:path*",
        headers: [{ key: "Cache-Control", value: longTtl }],
      },
      {
        source: "/bons-plans/:path*",
        headers: [{ key: "Cache-Control", value: longTtl }],
      },
      {
        source: "/methodologie",
        headers: [{ key: "Cache-Control", value: longTtl }],
      },
      {
        source: "/confidentialite",
        headers: [{ key: "Cache-Control", value: longTtl }],
      },
      {
        source: "/mentions-legales",
        headers: [{ key: "Cache-Control", value: longTtl }],
      },
      {
        source: "/selection/:path*",
        headers: [{ key: "Cache-Control", value: longTtl }],
      },
    ];
  },
  async redirects() {
    return [
      // Legacy routes → canonical routes. Doit être au niveau router-level
      // (pas permanentRedirect dans une page) pour renvoyer un vrai 308 et
      // éviter les "duplicate canonical" signalés par Google Search Console.
      { source: "/resultats", destination: "/matchs", permanent: true },
      { source: "/classements", destination: "/competitions", permanent: true },
      {
        source: "/classement/:slug",
        destination: "/ligue/:slug",
        permanent: true,
      },
      {
        source: "/ligue/:slug/classement",
        destination: "/ligue/:slug",
        permanent: true,
      },
      // Slug court "ligue-1" → variant pays explicite (DB stocke
      // "ligue-1-france"). Évite un 404 SEO sur l'URL la plus tapée.
      // `premier-league`, `la-liga`, `serie-a`, `bundesliga`,
      // `champions-league` existent déjà tels quels — pas de redirect requis.
      {
        source: "/ligue/ligue-1",
        destination: "/ligue/ligue-1-france",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.api-sports.io",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "images.bfmtv.com",
      },
      {
        protocol: "https",
        hostname: "imagenes2.mundodeportivo.com",
      },
      {
        protocol: "https",
        hostname: "africafoot.com",
      },
      {
        protocol: "https",
        hostname: "www.africatopsports.com",
      },
      {
        protocol: "https",
        hostname: "cdn.footmercato.net",
      },
      {
        protocol: "https",
        hostname: "i.guim.co.uk",
      },
      {
        protocol: "https",
        hostname: "e0.365dm.com",
      },
      {
        protocol: "https",
        hostname: "bilder.bild.de",
      },
      {
        protocol: "https",
        hostname: "img.rmcsport.bfmtv.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
  },
};

export default nextConfig;
