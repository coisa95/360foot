import { permanentRedirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Classements football — Ligues africaines et européennes",
  description:
    "Tous les classements des ligues de football africaines et européennes sur 360 Foot. Ligue 1 Côte d'Ivoire, Sénégal, Cameroun, Premier League, La Liga.",
  alternates: { canonical: "https://360-foot.com/classements" },
  openGraph: {
    title: "Classements football — 360 Foot",
    description:
      "Classements en direct des ligues africaines et européennes. Ligue 1, Premier League, Champions League et plus.",
    type: "website",
    url: "https://360-foot.com/classements",
    locale: "fr_FR",
    images: ["https://360-foot.com/api/og?title=Classements%20football"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Classements football — 360 Foot",
    description:
      "Classements en direct des ligues africaines et européennes. Ligue 1, Premier League, Champions League et plus.",
    images: ["https://360-foot.com/api/og?title=Classements%20football"],
  },
};

export default function ClassementsPage() {
  permanentRedirect("/competitions");
}
