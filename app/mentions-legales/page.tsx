import { Breadcrumb } from "@/components/breadcrumb";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Metadata } from "next";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Mentions légales du site 360 Foot. Informations sur l'éditeur, l'hébergeur et les conditions d'utilisation du site.",
  alternates: {
    canonical: "https://360-foot.com/mentions-legales",
  },
  openGraph: {
    title: "Mentions légales — 360 Foot",
    description:
      "Mentions légales du site 360 Foot. Informations sur l'éditeur, l'hébergeur et les conditions d'utilisation.",
    type: "website",
    url: "https://360-foot.com/mentions-legales",
    locale: "fr_FR",
    images: ["https://360-foot.com/api/og?title=Mentions%20l%C3%A9gales"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Mentions légales — 360 Foot",
    description:
      "Mentions légales du site 360 Foot. Informations sur l'éditeur, l'hébergeur et les conditions d'utilisation.",
    images: ["https://360-foot.com/api/og?title=Mentions%20l%C3%A9gales"],
  },
};

export default function LegalPage() {
  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Mentions légales" },
  ];

  return (
    <main className="min-h-screen text-white">
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Breadcrumb items={breadcrumbItems} />

        <div className="mt-6">
          <h1 className="font-display text-3xl font-bold text-emerald-400">Mentions légales</h1>
          <p className="text-gray-400 mt-2">Dernière mise à jour : mars 2026</p>
        </div>

        <Card className="bg-transparent border-gray-800 p-6 mt-6">
          <h2 className="font-display text-xl font-bold mb-4">Éditeur du site</h2>
          <Separator className="bg-gray-800 mb-4" />
          <div className="space-y-2 text-gray-300">
            <p><span className="text-gray-400">Nom du site :</span> 360 Foot</p>
            <p><span className="text-gray-400">URL :</span> https://360-foot.com</p>
            <p><span className="text-gray-400">Email :</span> contact@360-foot.com</p>
            <p><span className="text-gray-400">Directeur de la publication :</span> Le responsable de 360 Foot</p>
          </div>
        </Card>

        <Card className="bg-transparent border-gray-800 p-6 mt-6">
          <h2 className="font-display text-xl font-bold mb-4">Hébergement</h2>
          <Separator className="bg-gray-800 mb-4" />
          <div className="space-y-2 text-gray-300">
            <p><span className="text-gray-400">Hébergeur :</span> Vercel Inc.</p>
            <p><span className="text-gray-400">Adresse :</span> 440 N Barranca Ave #4133, Covina, CA 91723, USA</p>
            <p><span className="text-gray-400">Site web :</span> https://vercel.com</p>
          </div>
        </Card>

        <Card className="bg-transparent border-gray-800 p-6 mt-6">
          <h2 className="font-display text-xl font-bold mb-4">Propriété intellectuelle</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed mb-4">
            L&apos;ensemble du contenu du site 360 Foot (textes, images,
            graphismes, logo, icônes, etc.) est protégé par le droit
            d&apos;auteur et le droit de la propriété intellectuelle.
          </p>
          <p className="text-gray-300 leading-relaxed">
            Toute reproduction, représentation, modification, publication ou
            adaptation de tout ou partie des éléments du site, quel que soit le
            moyen ou le procédé utilisé, est interdite sauf autorisation écrite
            préalable de 360 Foot.
          </p>
        </Card>

        <Card className="bg-transparent border-gray-800 p-6 mt-6">
          <h2 className="font-display text-xl font-bold mb-4">Contenu généré par intelligence artificielle</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed mb-4">
            Une partie du contenu éditorial de ce site est générée par des
            systèmes d&apos;intelligence artificielle. Ces contenus sont basés
            sur des données factuelles provenant de sources fiables. 360 Foot
            s&apos;efforce de garantir l&apos;exactitude des informations
            publiées mais ne peut être tenu responsable d&apos;éventuelles
            erreurs ou imprécisions.
          </p>
        </Card>

        <Card className="bg-transparent border-gray-800 p-6 mt-6">
          <h2 className="font-display text-xl font-bold mb-4">Liens d&apos;affiliation et paris sportifs</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed mb-4">
            Ce site contient des liens d&apos;affiliation vers des sites de
            paris sportifs. 360 Foot peut percevoir une rémunération
            lorsqu&apos;un utilisateur s&apos;inscrit via ces liens. Cette
            rémunération n&apos;influence pas notre contenu éditorial.
          </p>
          <p className="text-gray-300 leading-relaxed">
            Les paris sportifs sont réservés aux personnes majeures (18 ans et
            plus). Les paris sportifs comportent des risques de perte
            financière. Jouez de manière responsable. En cas de difficulté,
            consultez le site joueurs-info-service.fr ou appelez le
            0 974 75 13 13.
          </p>
        </Card>

        <Card className="bg-transparent border-gray-800 p-6 mt-6">
          <h2 className="font-display text-xl font-bold mb-4">Limitation de responsabilité</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed mb-4">
            360 Foot s&apos;efforce de fournir des informations aussi précises
            que possible. Toutefois, il ne pourra être tenu responsable des
            omissions, des inexactitudes et des carences dans la mise à jour,
            qu&apos;elles soient de son fait ou du fait des tiers partenaires
            qui lui fournissent ces informations.
          </p>
          <p className="text-gray-300 leading-relaxed">
            Toutes les informations indiquées sur le site sont données à titre
            indicatif et sont susceptibles d&apos;évoluer. Les informations
            contenues sur le site ne sont pas contractuelles.
          </p>
        </Card>

        <Card className="bg-transparent border-gray-800 p-6 mt-6">
          <h2 className="font-display text-xl font-bold mb-4">Droit applicable</h2>
          <Separator className="bg-gray-800 mb-4" />
          <p className="text-gray-300 leading-relaxed">
            Les présentes mentions légales sont régies par le droit français. En
            cas de litige, les tribunaux français seront seuls compétents.
          </p>
        </Card>
      </div>
    </main>
  );
}
