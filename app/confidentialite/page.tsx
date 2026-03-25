import { Breadcrumb } from "@/components/breadcrumb";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Politique de confidentialite - 360 Foot",
  description:
    "Politique de confidentialite de 360 Foot. Decouvrez comment nous collectons, utilisons et protegeons vos donnees personnelles.",
  openGraph: {
    title: "Politique de confidentialite - 360 Foot",
    description:
      "Politique de confidentialite de 360 Foot. Decouvrez comment nous collectons, utilisons et protegeons vos donnees personnelles.",
    type: "website",
    url: "https://360-foot.com/confidentialite",
  },
};

export default function PrivacyPage() {
  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Politique de confidentialite" },
  ];

  return (
    <main className="min-h-screen bg-dark-bg text-white">
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Breadcrumb items={breadcrumbItems} />

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-lime-400">Politique de confidentialite</h1>
          <p className="text-gray-400 mt-2">Derniere mise a jour : mars 2026</p>
        </div>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Introduction</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed">
            La presente politique de confidentialite decrit comment 360 Foot
            (ci-apres &quot;nous&quot;, &quot;notre&quot; ou &quot;le Site&quot;)
            collecte, utilise et protege les informations personnelles des
            utilisateurs de notre site web accessible a l&apos;adresse
            https://360-foot.com.
          </p>
        </Card>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Donnees collectees</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed mb-4">
            Nous pouvons collecter les types de donnees suivants :
          </p>
          <ul className="space-y-2 text-gray-300 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>Donnees de navigation : adresse IP, type de navigateur, pages visitees, duree de visite</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>Cookies techniques necessaires au fonctionnement du site</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>Cookies analytiques pour ameliorer notre service (avec votre consentement)</span>
            </li>
          </ul>
        </Card>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Utilisation des donnees</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed mb-4">
            Les donnees collectees sont utilisees pour :
          </p>
          <ul className="space-y-2 text-gray-300 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>Assurer le bon fonctionnement du site</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>Ameliorer l&apos;experience utilisateur</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>Analyser les tendances de trafic</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>Personnaliser le contenu affiche</span>
            </li>
          </ul>
        </Card>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Cookies</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed mb-4">
            Notre site utilise des cookies pour ameliorer votre experience. Les
            cookies sont de petits fichiers texte stockes sur votre appareil. Vous
            pouvez configurer votre navigateur pour refuser les cookies, bien que
            cela puisse affecter certaines fonctionnalites du site.
          </p>
          <p className="text-gray-300 leading-relaxed">
            Nous utilisons des cookies de partenaires publicitaires et
            d&apos;affiliation. Ces cookies permettent de suivre les conversions et
            d&apos;optimiser nos recommandations.
          </p>
        </Card>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Liens d&apos;affiliation</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed">
            Notre site contient des liens d&apos;affiliation vers des sites de paris
            sportifs. Lorsque vous cliquez sur ces liens et effectuez une inscription,
            nous pouvons recevoir une commission. Ces liens sont clairement identifies
            et n&apos;influencent pas notre contenu editorial.
          </p>
        </Card>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Vos droits</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed mb-4">
            Conformement au Reglement General sur la Protection des Donnees (RGPD)
            et aux lois applicables, vous disposez des droits suivants :
          </p>
          <ul className="space-y-2 text-gray-300 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>Droit d&apos;acces a vos donnees personnelles</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>Droit de rectification de vos donnees</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>Droit a l&apos;effacement de vos donnees</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>Droit a la portabilite de vos donnees</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lime-400 mt-1">-</span>
              <span>Droit d&apos;opposition au traitement de vos donnees</span>
            </li>
          </ul>
          <p className="text-gray-300 leading-relaxed mt-4">
            Pour exercer ces droits, contactez-nous a : contact@360-foot.com
          </p>
        </Card>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Contact</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed">
            Pour toute question relative a notre politique de confidentialite,
            veuillez nous contacter a l&apos;adresse suivante : contact@360-foot.com
          </p>
        </Card>
      </div>
    </main>
  );
}
