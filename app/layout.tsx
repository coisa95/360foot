import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

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
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://360-foot.com",
    siteName: "360 Foot",
    title: "360 Foot — Actu Football Afrique & Europe en Direct",
    description:
      "Résultats, classements, transferts et analyses football. Toute l'actu foot en direct.",
  },
  twitter: {
    card: "summary_large_image",
    title: "360 Foot",
    description: "Toute l'actu football Afrique & Europe en direct.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={cn("dark font-sans antialiased", geist.variable)}>
      <body className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="min-h-[calc(100vh-8rem)]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
