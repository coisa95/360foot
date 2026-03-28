import { Breadcrumb } from "@/components/breadcrumb";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Metadata } from "next";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "À propos — Média football propulsé par l'IA",
  description:
    "Découvrez 360 Foot, le média innovant dédié au football africain et européen. Actualités, résultats, transferts et analyses propulsés par l'IA.",
  alternates: {
    canonical: "https://360-foot.com/a-propos",
  },
  openGraph: {
    title: "À propos de 360 Foot",
    description:
      "Découvrez 360 Foot, le média innovant dédié au football africain et européen propulsé par l'intelligence artificielle.",
    type: "website",
    url: "https://360-foot.com/a-propos",
    images: ["/api/og?title=%C3%80%20propos%20de%20360%20Foot"],
  },
};

export default function AboutPage() {
  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "À propos" },
  ];

  return (
    <main className="min-h-screen bg-dark-bg text-white">
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Breadcrumb items={breadcrumbItems} />

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-lime-400">À propos de 360 Foot</h1>
        </div>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Notre mission</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed mb-4">
            360 Foot est un média numérique innovant dédié au football
            africain et européen. Notre objectif est de fournir une couverture
            complète et en temps réel des ligues, équipes et joueurs à travers
            le monde.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            Nous couvrons les principales compétitions africaines (Ligue 1
            ivoirienne, Ligue 1 sénégalaise, championnats camerounais, malien,
            burkinabè, béninois, congolais, ghanéen, nigérian…), les grands
            championnats européens (Ligue 1, Premier League, Liga, Serie A,
            Bundesliga…), ainsi que les compétitions continentales (Ligue des
            Champions, Ligue des Champions CAF, Copa Libertadores…) et
            internationales (CAN, Euro, Copa América…).
          </p>
        </Card>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Technologie et innovation</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed mb-4">
            360 Foot utilise l&apos;intelligence artificielle pour générer du
            contenu éditorial de haute qualité. Notre système combine des
            données sportives en temps réel avec des modèles de langage avancés
            pour produire des articles informatifs, des analyses tactiques et
            des comptes-rendus de matchs.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            Chaque article généré par notre IA est basé sur des données
            factuelles vérifiées provenant de sources fiables. Nous nous
            engageons à fournir une information précise et de qualité à nos
            lecteurs.
          </p>
        </Card>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Notre équipe</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed mb-4">
            360 Foot est développé par une équipe passionnée de football et de
            technologie. Nous combinons une expertise dans le journalisme
            sportif, l&apos;intelligence artificielle et le développement web
            pour offrir la meilleure expérience possible à nos utilisateurs.
          </p>
        </Card>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Nous contacter</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed">
            Pour toute question, suggestion ou partenariat, n&apos;hésitez pas
            à nous contacter à l&apos;adresse suivante : contact@360-foot.com
          </p>
        </Card>
      </div>
    </main>
  );
}
