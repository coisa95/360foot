import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AffiliateTicker } from "@/components/affiliate-ticker";
import { LeagueSidebar } from "@/components/league-sidebar";
import { SwRegister } from "@/components/sw-register";
import { CookieBanner } from "@/components/cookie-banner";
import { AnalyticsLoader } from "@/components/analytics-loader";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { safeJsonLd } from "@/lib/json-ld";

const geist = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://360-foot.com"),
  title: {
    default: "360 Foot — Actu Football Afrique & Europe en Direct",
    template: "%s | 360 Foot",
  },
  description:
    "Résultats, classements, transferts et analyses football. Ligue 1 Côte d'Ivoire, Sénégal, Cameroun, Premier League et Champions League.",
  // Canonical is set per-page, not globally
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://360-foot.com",
    siteName: "360 Foot",
    title: "360 Foot — Actu Football Afrique & Europe en Direct",
    description:
      "Résultats, classements, transferts et analyses football. Toute l'actu foot en direct.",
    images: [
      {
        url: "https://360-foot.com/og-home.png",
        width: 1200,
        height: 630,
        alt: "360 Foot — Actu Football Afrique & Europe en Direct",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "360 Foot — Actu Football Afrique & Europe en Direct",
    description: "Résultats, classements, transferts et analyses football. Toute l'actu foot en direct.",
    images: ["https://360-foot.com/og-home.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  verification: {
    google: "GiHc3yxKs_kBQ_Ejsrcc5yme6wCt-q3gMfItxRn7tL0",
  },
};

// JSON-LD Organization + WebSite schema for Google Knowledge Panel
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://360-foot.com/#organization",
      name: "360 Foot",
      url: "https://360-foot.com",
      logo: {
        "@type": "ImageObject",
        url: "https://360-foot.com/icon-512.png",
        width: 512,
        height: 512,
      },
      description:
        "Média football spécialisé sur l'actualité du football africain et européen. Résultats, classements, transferts et analyses en direct.",
      foundingDate: "2025",
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": "https://360-foot.com/#website",
      url: "https://360-foot.com",
      name: "360 Foot",
      publisher: { "@id": "https://360-foot.com/#organization" },
      inLanguage: "fr-FR",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://360-foot.com/recherche?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={cn("dark font-sans antialiased", geist.variable)}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#a3e635" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="360 Foot" />
        <link rel="preconnect" href="https://media.api-sports.io" />
        <link rel="dns-prefetch" href="https://media.api-sports.io" />
        {/* GA/GTM scripts moved to AnalyticsLoader (client component, consent-gated) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-[#030014] text-white overflow-x-hidden">
        {/* ═══ Living Background ═══ */}
        <div className="bg-aurora" aria-hidden="true" />
        <div className="bg-hud-grid" aria-hidden="true" />
        <div className="bg-noise" aria-hidden="true">
          <svg width="100%" height="100%"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>
        </div>

        {/* ═══ Floating Orbs ═══ */}
        <div className="orb orb-emerald w-[200px] h-[200px] sm:w-[350px] sm:h-[350px] top-[10%] left-[-5%]" aria-hidden="true" />
        <div className="orb orb-violet w-[180px] h-[180px] sm:w-[300px] sm:h-[300px] top-[50%] right-[-8%]" aria-hidden="true" />
        <div className="orb orb-cyan w-[150px] h-[150px] sm:w-[250px] sm:h-[250px] bottom-[15%] left-[20%]" aria-hidden="true" />
        <div className="orb orb-gold w-[120px] h-[120px] sm:w-[200px] sm:h-[200px] top-[30%] right-[25%]" aria-hidden="true" />

        {/* ═══ Floating Symbols ═══ */}
        <div className="floating-symbol text-emerald-500/10 text-[40px] sm:text-[80px] top-[8%] left-[5%]" style={{animation: 'float-1 20s ease-in-out infinite'}} aria-hidden="true">$</div>
        <div className="floating-symbol text-violet-500/10 text-[30px] sm:text-[60px] top-[20%] right-[8%]" style={{animation: 'float-2 25s ease-in-out infinite'}} aria-hidden="true">&#9733;</div>
        <div className="floating-symbol text-cyan-500/10 text-[50px] sm:text-[100px] top-[45%] left-[3%]" style={{animation: 'float-3 18s ease-in-out infinite'}} aria-hidden="true">&#9917;</div>
        <div className="floating-symbol text-amber-500/10 text-[35px] sm:text-[70px] top-[65%] right-[5%]" style={{animation: 'float-1 22s ease-in-out infinite'}} aria-hidden="true">&#8364;</div>
        <div className="floating-symbol text-emerald-500/10 text-[25px] sm:text-[50px] top-[80%] left-[15%]" style={{animation: 'float-2 28s ease-in-out infinite'}} aria-hidden="true">&#9670;</div>
        <div className="floating-symbol text-violet-500/10 text-[45px] sm:text-[90px] bottom-[10%] right-[20%]" style={{animation: 'float-3 15s ease-in-out infinite'}} aria-hidden="true">FCFA</div>

        {/* ═══ Content ═══ */}
        <div className="relative z-10">
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-emerald-400 focus:px-4 focus:py-2 focus:text-black focus:font-bold">
            Aller au contenu principal
          </a>
          <Header />
          <AffiliateTicker />
          <LeagueSidebar />
          <div className="lg:ml-56">
            <main id="main-content" className="min-h-[calc(100vh-8rem)]">{children}</main>
            <Footer />
          </div>
        </div>
        <SwRegister />
        <AnalyticsLoader />
        <CookieBanner />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
