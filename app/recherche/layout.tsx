import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recherche — 360 Foot",
  description:
    "Recherchez joueurs, équipes, ligues et articles sur 360 Foot. Football africain et européen.",
  alternates: { canonical: "https://360-foot.com/recherche" },
  openGraph: {
    title: "Recherche — 360 Foot",
    description: "Recherchez joueurs, équipes, ligues et articles sur 360 Foot.",
    type: "website",
    url: "https://360-foot.com/recherche",
    images: ["/api/og?title=Recherche"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Recherche — 360 Foot",
    description: "Recherchez joueurs, équipes, ligues et articles sur 360 Foot.",
  },
};

export default function RechercheLayout({ children }: { children: React.ReactNode }) {
  return children;
}
