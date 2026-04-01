/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
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
