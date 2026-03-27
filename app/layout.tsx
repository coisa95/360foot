import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AffiliateTicker } from "@/components/affiliate-ticker";

const geist = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://360foot.info"),
  title: {
    default: "360 Foot — Actu Football Afrique & Europe en Direct",
    template: "%s | 360 Foot",
  },
  description:
    "Résultats, classements, transferts et analyses football. Ligue 1 Côte d'Ivoire, Sénégal, Cameroun, Premier League, Champions League. Toute l'actu foot en direct.",
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
    url: "https://360foot.info",
    siteName: "360 Foot",
    title: "360 Foot — Actu Football Afrique & Europe en Direct",
    description:
      "Résultats, classements, transferts et analyses football. Toute l'actu foot en direct.",
    images: [
      {
        url: "https://360foot.info/og-home.png",
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
    images: ["https://360foot.info/og-home.png"],
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
      "@id": "https://360foot.info/#organization",
      name: "360 Foot",
      url: "https://360foot.info",
      logo: {
        "@type": "ImageObject",
        url: "https://360foot.info/icon-512.png",
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
      "@id": "https://360foot.info/#website",
      url: "https://360foot.info",
      name: "360 Foot",
      publisher: { "@id": "https://360foot.info/#organization" },
      inLanguage: "fr-FR",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://360foot.info/actu?q={search_term_string}",
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
        <link rel="preconnect" href="https://images.pexels.com" />
        <link rel="dns-prefetch" href="https://images.pexels.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <Header />
        <AffiliateTicker />
        <main className="min-h-[calc(100vh-8rem)]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
