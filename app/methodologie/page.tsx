import { Breadcrumb } from "@/components/breadcrumb";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Methodologie - Comment 360 Foot produit ses contenus - 360 Foot",
  description:
    "Decouvrez notre methodologie : comment 360 Foot utilise l'intelligence artificielle pour generer des articles de qualite sur le football africain.",
  alternates: {
    canonical: "https://360-foot.com/methodologie",
  },
  openGraph: {
    title: "Methodologie - Comment 360 Foot produit ses contenus",
    description:
      "Decouvrez notre methodologie : comment 360 Foot utilise l'intelligence artificielle pour generer des articles de qualite.",
    type: "website",
    url: "https://360-foot.com/methodologie",
  },
};

export default function MethodologyPage() {
  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Methodologie" },
  ];

  return (
    <main className="min-h-screen bg-dark-bg text-white">
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Breadcrumb items={breadcrumbItems} />

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-lime-400">Notre methodologie</h1>
          <p className="text-gray-400 mt-2">
            Transparence sur nos processus de creation de contenu
          </p>
        </div>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Sources de donnees</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed mb-4">
            360 Foot s&apos;appuie sur des sources de donnees sportives fiables et
            reconnues pour garantir l&apos;exactitude de ses informations. Nos donnees
            proviennent de :
          </p>
          <ul className="space-y-2 text-gray-300 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>API de donnees sportives professionnelles fournissant les scores, statistiques et compositions en temps reel</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>Federations nationales de football pour les informations officielles</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>Sources mediatiques reconnues pour les transferts et actualites</span>
            </li>
          </ul>
        </Card>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Generation de contenu par IA</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed mb-4">
            Nos articles sont generes par des modeles d&apos;intelligence artificielle
            de derniere generation. Le processus suit plusieurs etapes :
          </p>
          <div className="space-y-4">
            <div className="border-l-2 border-lime-400 pl-4">
              <h3 className="font-bold text-white">1. Collecte des donnees</h3>
              <p className="text-gray-400 text-sm mt-1">
                Les donnees brutes sont collectees automatiquement depuis nos sources
                via des API securisees. Scores, statistiques, compositions et
                evenements sont structures et valides.
              </p>
            </div>
            <div className="border-l-2 border-lime-400 pl-4">
              <h3 className="font-bold text-white">2. Analyse et contextualisation</h3>
              <p className="text-gray-400 text-sm mt-1">
                L&apos;IA analyse les donnees dans leur contexte : forme des equipes,
                historique des confrontations, enjeux du classement et dynamique de la
                competition.
              </p>
            </div>
            <div className="border-l-2 border-lime-400 pl-4">
              <h3 className="font-bold text-white">3. Redaction</h3>
              <p className="text-gray-400 text-sm mt-1">
                Le modele de langage genere un article structure en francais, avec un
                ton journalistique adapte au type de contenu (compte-rendu, analyse,
                avant-match).
              </p>
            </div>
            <div className="border-l-2 border-lime-400 pl-4">
              <h3 className="font-bold text-white">4. Controle qualite</h3>
              <p className="text-gray-400 text-sm mt-1">
                Chaque article passe par un processus de verification automatique :
                coherence des donnees, qualite linguistique et conformite editoriale.
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Controle qualite</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed mb-4">
            La qualite est au coeur de notre demarche. Nous appliquons plusieurs
            niveaux de controle :
          </p>
          <ul className="space-y-2 text-gray-300 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>Verification automatique de la coherence des scores et statistiques</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>Detection des anomalies et incoherences dans les donnees</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>Analyse linguistique pour garantir la qualite redactionnelle</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>Mise a jour continue des articles en cas de nouvelles informations</span>
            </li>
          </ul>
        </Card>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Transparence</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed">
            Nous croyons en la transparence totale vis-a-vis de nos lecteurs. Tous nos
            articles generes par IA sont clairement identifies comme tels. Nous nous
            engageons a ne jamais presenter du contenu genere par IA comme du
            journalisme humain traditionnel. Cette page fait partie de notre engagement
            envers les principes E-E-A-T (Experience, Expertise, Autorite,
            Fiabilite).
          </p>
        </Card>
      </div>
    </main>
  );
}
