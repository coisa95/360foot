import { Breadcrumb } from "@/components/breadcrumb";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "A propos de 360 Foot - Media football africain propulse par l'IA",
  description:
    "Decouvrez 360 Foot, le media innovant dedie au football africain. Actualites, resultats, transferts et analyses propulses par l'intelligence artificielle.",
  alternates: {
    canonical: "https://360-foot.com/a-propos",
  },
  openGraph: {
    title: "A propos de 360 Foot",
    description:
      "Decouvrez 360 Foot, le media innovant dedie au football africain propulse par l'intelligence artificielle.",
    type: "website",
    url: "https://360-foot.com/a-propos",
  },
};

export default function AboutPage() {
  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "A propos" },
  ];

  return (
    <main className="min-h-screen bg-dark-bg text-white">
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Breadcrumb items={breadcrumbItems} />

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-lime-400">A propos de 360 Foot</h1>
        </div>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Notre mission</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed mb-4">
            360 Foot est un media numerique innovant entierement dedie au football
            africain. Notre objectif est de fournir une couverture complete et en temps
            reel des ligues, equipes et joueurs du continent africain.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            Nous couvrons les principales competitions africaines, notamment la Ligue 1
            ivoirienne, la Ligue 1 senegalaise, le championnat camerounais, la Ligue 1
            malienne et le championnat burkinabe, ainsi que les competitions
            continentales et les selections nationales.
          </p>
        </Card>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Technologie et innovation</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed mb-4">
            360 Foot utilise l&apos;intelligence artificielle pour generer du contenu
            editorial de haute qualite. Notre systeme combine des donnees sportives en
            temps reel avec des modeles de langage avances pour produire des articles
            informatifs, des analyses tactiques et des comptes-rendus de matchs.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            Chaque article genere par notre IA est base sur des donnees factuelles
            verifiees provenant de sources fiables. Nous nous engageons a fournir une
            information precise et de qualite a nos lecteurs.
          </p>
        </Card>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Notre equipe</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed mb-4">
            360 Foot est developpe par une equipe passionnee de football et de
            technologie. Nous combinons une expertise dans le journalisme sportif,
            l&apos;intelligence artificielle et le developpement web pour offrir la
            meilleure experience possible a nos utilisateurs.
          </p>
        </Card>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Nous contacter</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed">
            Pour toute question, suggestion ou partenariat, n&apos;hesitez pas a nous
            contacter a l&apos;adresse suivante : contact@360-foot.com
          </p>
        </Card>
      </div>
    </main>
  );
}
