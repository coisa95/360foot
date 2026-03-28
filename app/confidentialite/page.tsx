import { Breadcrumb } from "@/components/breadcrumb";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Politique de confidentialité — 360 Foot",
  description:
    "Politique de confidentialité de 360 Foot. Découvrez comment nous collectons, utilisons et protégeons vos données personnelles.",
  alternates: {
    canonical: "https://360-foot.com/confidentialite",
  },
  openGraph: {
    title: "Politique de confidentialité — 360 Foot",
    description:
      "Politique de confidentialité de 360 Foot. Découvrez comment nous collectons, utilisons et protégeons vos données personnelles.",
    type: "website",
    url: "https://360-foot.com/confidentialite",
    images: ["/api/og?title=Politique%20de%20confidentialit%C3%A9"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Politique de confidentialité — 360 Foot",
    description:
      "Politique de confidentialité de 360 Foot. Découvrez comment nous collectons, utilisons et protégeons vos données personnelles.",
  },
};

export default function PrivacyPage() {
  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Politique de confidentialité" },
  ];

  return (
    <main className="min-h-screen bg-dark-bg text-white">
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Breadcrumb items={breadcrumbItems} />

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-lime-400">Politique de confidentialité</h1>
          <p className="text-gray-400 mt-2">Dernière mise à jour : mars 2026</p>
        </div>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Introduction</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed">
            La présente politique de confidentialité décrit comment 360 Foot
            (ci-après &quot;nous&quot;, &quot;notre&quot; ou &quot;le Site&quot;)
            collecte, utilise et protège les informations personnelles des
            utilisateurs de notre site web accessible à l&apos;adresse
            https://360-foot.com.
          </p>
        </Card>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Données collectées</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed mb-4">
            Nous pouvons collecter les types de données suivants :
          </p>
          <ul className="space-y-2 text-gray-300 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>Données de navigation : adresse IP, type de navigateur, pages visitées, durée de visite</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>Cookies techniques nécessaires au fonctionnement du site</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>Cookies analytiques pour améliorer notre service (avec votre consentement)</span>
            </li>
          </ul>
        </Card>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Utilisation des données</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed mb-4">
            Les données collectées sont utilisées pour :
          </p>
          <ul className="space-y-2 text-gray-300 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>Assurer le bon fonctionnement du site</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>Améliorer l&apos;expérience utilisateur</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>Analyser les tendances de trafic</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>Personnaliser le contenu affiché</span>
            </li>
          </ul>
        </Card>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Cookies</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed mb-4">
            Notre site utilise des cookies pour améliorer votre expérience. Les
            cookies sont de petits fichiers texte stockés sur votre appareil.
            Vous pouvez configurer votre navigateur pour refuser les cookies,
            bien que cela puisse affecter certaines fonctionnalités du site.
          </p>
          <p className="text-gray-300 leading-relaxed">
            Nous utilisons des cookies de partenaires publicitaires et
            d&apos;affiliation. Ces cookies permettent de suivre les conversions
            et d&apos;optimiser nos recommandations.
          </p>
        </Card>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Liens d&apos;affiliation</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed">
            Notre site contient des liens d&apos;affiliation vers des sites de
            paris sportifs. Lorsque vous cliquez sur ces liens et effectuez une
            inscription, nous pouvons recevoir une commission. Ces liens sont
            clairement identifiés et n&apos;influencent pas notre contenu
            éditorial.
          </p>
        </Card>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Vos droits</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed mb-4">
            Conformément au Règlement Général sur la Protection des Données
            (RGPD) et aux lois applicables, vous disposez des droits suivants :
          </p>
          <ul className="space-y-2 text-gray-300 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>Droit d&apos;accès à vos données personnelles</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>Droit de rectification de vos données</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>Droit à l&apos;effacement de vos données</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>Droit à la portabilité de vos données</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>Droit d&apos;opposition au traitement de vos données</span>
            </li>
          </ul>
          <p className="text-gray-300 leading-relaxed mt-4">
            Pour exercer ces droits, contactez-nous à : contact@360-foot.com
          </p>
        </Card>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Contact</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed">
            Pour toute question relative à notre politique de confidentialité,
            veuillez nous contacter à l&apos;adresse suivante :
            contact@360-foot.com
          </p>
        </Card>
      </div>
    </main>
  );
}
