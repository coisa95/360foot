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
import { PromoPopup } from "@/components/promo-popup";
import { AnalyticsLoader } from "@/components/analytics-loader";
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
  alternates: {
    canonical: "https://360-foot.com",
    languages: {
      "fr-FR": "https://360-foot.com",
      "fr-CI": "https://360-foot.com",
      "fr-SN": "https://360-foot.com",
      "fr-CM": "https://360-foot.com",
      "fr-BJ": "https://360-foot.com",
      "fr-TG": "https://360-foot.com",
      "fr-ML": "https://360-foot.com",
      "fr-BF": "https://360-foot.com",
      "x-default": "https://360-foot.com",
    },
  },
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
    site: "@360foot",
    title: "360 Foot — Actu Football Afrique & Europe en Direct",
    description: "Résultats, classements, transferts et analyses football. Toute l'actu foot en direct.",
    images: ["https://360-foot.com/og-home.png"],
  },
  robots: {
    index: true,
    follow: true,
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
      sameAs: [
        "https://twitter.com/360foot",
        "https://www.facebook.com/360foot",
        "https://www.instagram.com/360foot",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "editorial",
        email: "redaction@360-foot.com",
        availableLanguage: ["French"],
      },
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
    <html lang="fr" className={cn("font-sans antialiased", geist.variable)}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="360 Foot" />
        <link rel="preconnect" href="https://media.api-sports.io" />
        <link rel="dns-prefetch" href="https://media.api-sports.io" />
        {/* hreflang — same content for all francophone countries */}
        <link rel="alternate" hrefLang="fr" href="https://360-foot.com" />
        <link rel="alternate" hrefLang="fr-CI" href="https://360-foot.com" />
        <link rel="alternate" hrefLang="fr-SN" href="https://360-foot.com" />
        <link rel="alternate" hrefLang="fr-CM" href="https://360-foot.com" />
        <link rel="alternate" hrefLang="fr-BJ" href="https://360-foot.com" />
        <link rel="alternate" hrefLang="fr-TG" href="https://360-foot.com" />
        <link rel="alternate" hrefLang="fr-ML" href="https://360-foot.com" />
        <link rel="alternate" hrefLang="fr-BF" href="https://360-foot.com" />
        <link rel="alternate" hrefLang="x-default" href="https://360-foot.com" />
        {/* GA/GTM scripts moved to AnalyticsLoader (client component, consent-gated) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
        {/* ═══ Living Background ═══ */}
        <div className="bg-aurora" aria-hidden="true" />
        <div className="bg-noise" aria-hidden="true">
          <svg width="100%" height="100%"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>
        </div>

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
        <PromoPopup />
      </body>
    </html>
  );
}
