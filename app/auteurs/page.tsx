import { Breadcrumb } from "@/components/breadcrumb";
import { Card } from "@/components/ui/card";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Auteurs — 360 Foot",
  description:
    "Découvrez l'équipe rédactionnelle de 360 Foot : journalistes spécialisés football africain, pronostics et compétitions internationales.",
  alternates: {
    canonical: "https://360-foot.com/auteurs",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
  },
  openGraph: {
    title: "Auteurs — 360 Foot",
    description:
      "L'équipe rédactionnelle de 360 Foot, spécialiste du football africain.",
    type: "website",
    url: "https://360-foot.com/auteurs",
    locale: "fr_FR",
  },
};

const AUTEURS = [
  {
    slug: "coffi",
    name: "Coffi",
    role: "Rédacteur en chef",
    bio: "Passionné de football africain, spécialiste pronostics et analyse Ligue 1, CAN, Champions League.",
    image: "/auteurs/coffi.jpg",
  },
];

export default function AuteursPage() {
  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Auteurs" },
  ];

  return (
    <main className="min-h-screen bg-transparent text-slate-900">
      <div className="container mx-auto px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        <header className="mt-6 mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-emerald-600">
            Notre équipe rédactionnelle
          </h1>
          <p className="text-slate-500 mt-3 max-w-2xl">
            Découvrez les journalistes qui couvrent au quotidien le football
            africain et international pour 360 Foot.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AUTEURS.map((a) => (
            <Link key={a.slug} href={`/auteurs/${a.slug}`} className="group">
              <Card className="bg-slate-50 border-slate-200 p-6 h-full transition hover:border-emerald-500/40 hover:shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-emerald-100 bg-slate-200">
                    <Image
                      src={a.image}
                      alt={`Photo de ${a.name}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-slate-900 group-hover:text-emerald-600">
                      {a.name}
                    </h2>
                    <p className="text-sm text-slate-500">{a.role}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                  {a.bio}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
