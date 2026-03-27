import { Breadcrumb } from "@/components/breadcrumb";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Mentions legales - 360 Foot",
  description:
    "Mentions legales du site 360 Foot. Informations sur l'editeur, l'hebergeur et les conditions d'utilisation du site.",
  alternates: {
    canonical: "https://360-foot.com/mentions-legales",
  },
  openGraph: {
    title: "Mentions legales - 360 Foot",
    description:
      "Mentions legales du site 360 Foot. Informations sur l'editeur, l'hebergeur et les conditions d'utilisation.",
    type: "website",
    url: "https://360-foot.com/mentions-legales",
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Mentions legales - 360 Foot",
    description:
      "Mentions legales du site 360 Foot. Informations sur l'editeur, l'hebergeur et les conditions d'utilisation.",
  },
};

export default function LegalPage() {
  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Mentions legales" },
  ];

  return (
    <main className="min-h-screen bg-dark-bg text-white">
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Breadcrumb items={breadcrumbItems} />

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-lime-400">Mentions legales</h1>
          <p className="text-gray-400 mt-2">Derniere mise a jour : mars 2026</p>
        </div>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Editeur du site</h2>
          <Separator className="bg-gray-800 mb-4" />
          <div className="space-y-2 text-gray-300">
            <p><span className="text-gray-400">Nom du site :</span> 360 Foot</p>
            <p><span className="text-gray-400">URL :</span> https://360-foot.com</p>
            <p><span className="text-gray-400">Email :</span> contact@360-foot.com</p>
            <p><span className="text-gray-400">Directeur de la publication :</span> Le responsable de 360 Foot</p>
          </div>
        </Card>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Hebergement</h2>
          <Separator className="bg-gray-800 mb-4" />
          <div className="space-y-2 text-gray-300">
            <p><span className="text-gray-400">Hebergeur :</span> Vercel Inc.</p>
            <p><span className="text-gray-400">Adresse :</span> 440 N Barranca Ave #4133, Covina, CA 91723, USA</p>
            <p><span className="text-gray-400">Site web :</span> https://vercel.com</p>
          </div>
        </Card>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Propriete intellectuelle</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed mb-4">
            L&apos;ensemble du contenu du site 360 Foot (textes, images, graphismes,
            logo, icones, etc.) est protege par le droit d&apos;auteur et le droit de
            la propriete intellectuelle.
          </p>
          <p className="text-gray-300 leading-relaxed">
            Toute reproduction, representation, modification, publication ou
            adaptation de tout ou partie des elements du site, quel que soit le
            moyen ou le procede utilise, est interdite sauf autorisation ecrite
            prealable de 360 Foot.
          </p>
        </Card>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Contenu genere par intelligence artificielle</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed mb-4">
            Une partie du contenu editorial de ce site est genere par des systemes
            d&apos;intelligence artificielle. Ces contenus sont bases sur des donnees
            factuelles provenant de sources fiables. 360 Foot s&apos;efforce de
            garantir l&apos;exactitude des informations publiees mais ne peut etre
            tenu responsable d&apos;eventuelles erreurs ou imprecisions.
          </p>
          <p className="text-gray-300 leading-relaxed">
            Pour plus de details sur notre processus de creation de contenu,
            consultez notre{" "}
            <a href="/methodologie" className="text-lime-400 hover:underline">
              page methodologie
            </a>
            .
          </p>
        </Card>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Liens d&apos;affiliation et paris sportifs</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed mb-4">
            Ce site contient des liens d&apos;affiliation vers des sites de paris
            sportifs. 360 Foot peut percevoir une remuneration lorsqu&apos;un
            utilisateur s&apos;inscrit via ces liens. Cette remuneration
            n&apos;influence pas notre contenu editorial.
          </p>
          <p className="text-gray-300 leading-relaxed">
            Les paris sportifs sont reserves aux personnes majeures (18 ans et plus).
            Les paris sportifs comportent des risques de perte financiere. Jouez de
            maniere responsable. En cas de difficulte, consultez le site
            joueurs-info-service.fr.
          </p>
        </Card>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Limitation de responsabilite</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed mb-4">
            360 Foot s&apos;efforce de fournir des informations aussi precises que
            possible. Toutefois, il ne pourra etre tenu responsable des omissions,
            des inexactitudes et des carences dans la mise a jour, qu&apos;elles
            soient de son fait ou du fait des tiers partenaires qui lui fournissent
            ces informations.
          </p>
          <p className="text-gray-300 leading-relaxed">
            Toutes les informations indiquees sur le site sont donnees a titre
            indicatif et sont susceptibles d&apos;evoluer. Les informations
            contenues sur le site ne sont pas contractuelles.
          </p>
        </Card>

        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Droit applicable</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed">
            Les presentes mentions legales sont regies par le droit francais. En cas
            de litige, les tribunaux francais seront seuls competents.
          </p>
        </Card>
      </div>
    </main>
  );
}
