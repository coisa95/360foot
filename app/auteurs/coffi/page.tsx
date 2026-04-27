import { createAnonClient } from "@/lib/supabase";
import { safeJsonLd } from "@/lib/json-ld";
import { getCspNonce } from "@/lib/csp-nonce";
import { Breadcrumb } from "@/components/breadcrumb";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Coffi — Rédacteur en chef 360 Foot",
  description:
    "Coffi, rédacteur en chef de 360 Foot. Passionné de football africain, spécialiste pronostics et analyse Ligue 1, CAN, Champions League.",
  alternates: {
    canonical: "https://360-foot.com/auteurs/coffi",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
  },
  openGraph: {
    title: "Coffi — Rédacteur en chef 360 Foot",
    description:
      "Coffi, rédacteur en chef de 360 Foot. Passionné de football africain, spécialiste pronostics et analyse.",
    type: "profile",
    url: "https://360-foot.com/auteurs/coffi",
    locale: "fr_FR",
    images: ["https://360-foot.com/auteurs/coffi.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Coffi — Rédacteur en chef 360 Foot",
    description:
      "Coffi, rédacteur en chef de 360 Foot. Passionné de football africain, spécialiste pronostics et analyse.",
    images: ["https://360-foot.com/auteurs/coffi.jpg"],
  },
};

const SPECIALITES = [
  "Football africain (Ligue 1 CI, Sénégal, Cameroun)",
  "Pronostics",
  "Transferts",
  "Statistiques",
];

export default async function CoffiAuthorPage() {
  const supabase = createAnonClient();

  const { data: articles } = await supabase
    .from("articles")
    .select("id,slug,title,excerpt,published_at")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(10);

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Auteurs", href: "/auteurs" },
    { label: "Coffi" },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": "https://360-foot.com/auteurs/coffi#person",
    name: "Coffi",
    jobTitle: "Rédacteur en chef",
    url: "https://360-foot.com/auteurs/coffi",
    image: "https://360-foot.com/auteurs/coffi.jpg",
    description:
      "Rédacteur en chef de 360 Foot, spécialiste football africain et pronostics.",
    knowsAbout: [
      "Football africain",
      "Ligue 1 Côte d'Ivoire",
      "CAN",
      "Pronostics football",
      "Champions League",
      "Premier League",
    ],
    worksFor: {
      "@type": "NewsMediaOrganization",
      name: "360 Foot",
      url: "https://360-foot.com",
    },
    nationality: "Côte d'Ivoire",
  };

  return (
    <main className="min-h-screen bg-transparent text-slate-900">
      <script
        type="application/ld+json"
        nonce={getCspNonce()}
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      <div className="container mx-auto px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        {/* Profil */}
        <Card className="bg-slate-50 border-slate-200 p-6 mt-6">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
            <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full border-4 border-emerald-100 bg-slate-200">
              <Image
                src="/auteurs/coffi.jpg"
                alt="Photo de Coffi, rédacteur en chef de 360 Foot"
                fill
                className="object-cover"
                sizes="128px"
                priority
              />
            </div>
            <div className="flex-1">
              <h1 className="font-display text-3xl md:text-4xl font-bold text-emerald-600">
                Coffi — Rédacteur en chef 360 Foot
              </h1>
              <p className="text-slate-500 mt-2">
                Rédacteur en chef · Spécialiste football africain
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200">
                  Côte d&apos;Ivoire
                </Badge>
                <Badge className="bg-slate-100 text-slate-700 border-slate-300">
                  10+ ans d&apos;expérience
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Bio */}
        <Card className="bg-slate-50 border-slate-200 p-6 mt-6">
          <h2 className="font-display text-xl font-bold text-emerald-600 mb-4">
            À propos
          </h2>
          <Separator className="bg-slate-200 mb-4" />
          <div className="prose prose-emerald max-w-none prose-p:text-slate-600 prose-p:leading-relaxed">
            <p>
              Passionné de football depuis l&apos;enfance, Coffi suit avec
              attention le football africain dans toute sa diversité : Ligue 1
              Côte d&apos;Ivoire, championnats du Sénégal, du Cameroun, du Mali
              et du Burkina Faso, mais aussi la Coupe d&apos;Afrique des
              Nations et les compétitions internationales où brillent les
              stars du continent.
            </p>
            <p>
              Formé au journalisme sportif, il met sa plume au service des
              lecteurs francophones d&apos;Afrique et d&apos;ailleurs. Analyses
              tactiques, décryptage des transferts, pronostics étayés par les
              statistiques : son objectif est de proposer une couverture
              fiable, claire et engagée du football tel qu&apos;on le vit en
              Afrique francophone.
            </p>
            <p>
              Avec plus de 10 ans d&apos;expérience dans la rédaction
              sportive, il dirige aujourd&apos;hui la rédaction de 360 Foot et
              veille à la qualité éditoriale de chaque article publié sur le
              site.
            </p>
          </div>
        </Card>

        {/* Spécialités */}
        <Card className="bg-slate-50 border-slate-200 p-6 mt-6">
          <h2 className="font-display text-xl font-bold text-emerald-600 mb-4">
            Mes spécialités
          </h2>
          <Separator className="bg-slate-200 mb-4" />
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SPECIALITES.map((s) => (
              <li
                key={s}
                className="flex items-start gap-2 text-slate-700"
              >
                <span className="mt-1 text-emerald-600">●</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Articles récents */}
        {articles && articles.length > 0 && (
          <div className="mt-8">
            <h2 className="font-display text-xl font-bold text-emerald-600 mb-4">
              Articles récents
            </h2>
            <Separator className="bg-slate-200 mb-4" />
            <ul className="space-y-3">
              {articles.map((a) => (
                <li key={a.id as string}>
                  <Link
                    href={`/actu/${a.slug}`}
                    className="block rounded-lg border border-slate-200 bg-white p-4 transition hover:border-emerald-500/40 hover:shadow-sm"
                  >
                    <h3 className="font-display text-base font-semibold text-slate-900 hover:text-emerald-600">
                      {a.title as string}
                    </h3>
                    {a.excerpt && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                        {a.excerpt as string}
                      </p>
                    )}
                    {a.published_at && (
                      <time
                        dateTime={a.published_at as string}
                        className="mt-2 block text-xs text-slate-400"
                      >
                        {new Date(a.published_at as string).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </time>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
