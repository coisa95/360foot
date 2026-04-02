import { permanentRedirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Résultats football — Scores en direct",
  description:
    "Tous les résultats de football en direct. Scores, classements et calendrier des matchs des ligues africaines et européennes.",
  alternates: { canonical: "https://360-foot.com/matchs" },
  openGraph: {
    title: "Résultats football — 360 Foot",
    description:
      "Scores en direct et résultats du football africain et européen.",
    type: "website",
    url: "https://360-foot.com/resultats",
    locale: "fr_FR",
    images: ["https://360-foot.com/api/og?title=R%C3%A9sultats%20football"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Résultats football — 360 Foot",
    description:
      "Scores en direct et résultats du football africain et européen.",
    images: ["https://360-foot.com/api/og?title=R%C3%A9sultats%20football"],
  },
};

export default function ResultatsRedirect() {
  permanentRedirect("/matchs");
}
