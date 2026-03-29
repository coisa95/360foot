import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AffiliateTicker } from "@/components/affiliate-ticker";
import { LeagueSidebar } from "@/components/league-sidebar";
import { SwRegister } from "@/components/sw-register";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
  keywords: [
    "football",
    "foot",
    "Afrique",
    "Côte d'Ivoire",
    "Sénégal",
    "Cameroun",
    "résultats",
    "classements",
    "transferts",
    "Premier League",
    "Champions League",
  ],
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
        target: "https://360-foot.com/actu?q={search_term_string}",
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
        {/* Google Tag Manager */}
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID}');
              `,
            }}
          />
        )}
        {/* Google Analytics 4 */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
                `,
              }}
            />
          </>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground overflow-x-hidden">
        {/* GTM noscript fallback */}
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-lime-400 focus:px-4 focus:py-2 focus:text-black focus:font-bold">
          Aller au contenu principal
        </a>
        <Header />
        <AffiliateTicker />
        <LeagueSidebar />
        <div className="lg:ml-56">
          <main id="main-content" className="min-h-[calc(100vh-8rem)]">{children}</main>
          <Footer />
        </div>
        <SwRegister />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
