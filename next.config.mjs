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
