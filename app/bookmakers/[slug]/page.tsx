import { createClient } from "@/lib/supabase";
import { safeJsonLd } from "@/lib/json-ld";
import { Breadcrumb } from "@/components/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 21600;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createClient();

  const { data: bookmaker } = await supabase
    .from("bookmakers")
    .select("name,slug,affiliate_url,rating")
    .eq("slug", slug)
    .single();

  if (!bookmaker) return { title: "Bookmaker introuvable - 360 Foot" };

  const title = `${bookmaker.name} - Avis, bonus et inscription - 360 Foot`;
  const fullDesc = `Decouvrez notre avis sur ${bookmaker.name} : bonus de bienvenue, cotes, methodes de paiement et pays disponibles.`;
  const description = fullDesc.length > 155 ? fullDesc.slice(0, 152) + "..." : fullDesc;

  return {
    title,
    description,
    alternates: {
      canonical: `https://360-foot.com/bookmakers/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://360-foot.com/bookmakers/${slug}`,
      locale: "fr_FR",
      images: [`https://360-foot.com/api/og?title=${encodeURIComponent(title)}`],
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [`https://360-foot.com/api/og?title=${encodeURIComponent(title)}`],
    },
  };
}

export default async function BookmakerPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createClient();

  const { data: bookmaker } = await supabase
    .from("bookmakers")
    .select("id,name,slug,rating,bonus_json,description,affiliate_url,supported_countries,payment_methods,min_deposit,license,pros,cons,countries")
    .eq("slug", slug)
    .single();

  if (!bookmaker) notFound();

  const bonusJson = bookmaker.bonus_json as Record<string, string> | null;
  const bonusText = bonusJson
    ? bonusJson["CI"] || bonusJson["default"] || Object.values(bonusJson)[0] || null
    : null;

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Paris sportifs", href: "/bookmakers" },
    { label: bookmaker.name },
  ];

  return (
    <main className="min-h-screen bg-transparent text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            "@context": "https://schema.org",
            "@type": "Review",
            itemReviewed: {
              "@type": "Organization",
              name: bookmaker.name,
              url: bookmaker.affiliate_url || `https://360-foot.com/bookmakers/${slug}`,
            },
            reviewRating: bookmaker.rating
              ? {
                  "@type": "Rating",
                  ratingValue: bookmaker.rating,
                  bestRating: 5,
                }
              : undefined,
            author: {
              "@type": "Organization",
              name: "360 Foot",
            },
            publisher: {
              "@type": "Organization",
              name: "360 Foot",
            },
          }),
        }}
      />
      <div className="container mx-auto px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        {/* En-tete */}
        <Card className="bg-slate-50 border-slate-200 p-6 mt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="font-display text-3xl font-bold text-emerald-600">{bookmaker.name}</h1>
              {bookmaker.rating && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-slate-500">Note :</span>
                  <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-lg px-3">
                    {bookmaker.rating}/5
                  </Badge>
                </div>
              )}
            </div>

            <Link
              href={`/go/${slug}`}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 px-10 rounded-lg transition-colors text-center text-lg whitespace-nowrap"
            >
              S&apos;inscrire et obtenir le bonus
            </Link>
          </div>
        </Card>

        {/* Bonus */}
        {bonusText && (
          <Card className="bg-emerald-50 border-emerald-200 p-6 mt-6">
            <h2 className="font-display text-lg font-bold text-emerald-600 mb-2">Bonus de bienvenue</h2>
            <p className="text-2xl font-bold text-slate-900">{bonusText}</p>
          </Card>
        )}

        {/* Description detaillee */}
        {bookmaker.description && (
          <Card className="bg-slate-50 border-slate-200 p-6 mt-6">
            <h2 className="font-display text-lg font-bold text-emerald-600 mb-4">A propos de {bookmaker.name}</h2>
            <Separator className="bg-slate-200 mb-4" />
            <p className="text-slate-700 leading-relaxed">{bookmaker.description}</p>
          </Card>
        )}

        {/* Informations detaillees */}
        <Card className="bg-slate-50 border-slate-200 p-6 mt-6">
          <h2 className="font-display text-lg font-bold text-emerald-600 mb-4">Informations</h2>
          <Separator className="bg-slate-200 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bookmaker.supported_countries && (
              <div>
                <p className="text-slate-500 text-sm mb-2">Pays disponibles</p>
                <div className="flex flex-wrap gap-2">
                  {(bookmaker.supported_countries as string[]).map((country) => (
                    <Badge
                      key={country}
                      className="bg-slate-100 text-slate-700 border-slate-300"
                    >
                      {country}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {bookmaker.payment_methods && (
              <div>
                <p className="text-slate-500 text-sm mb-2">Methodes de paiement</p>
                <div className="flex flex-wrap gap-2">
                  {(bookmaker.payment_methods as string[]).map((method) => (
                    <Badge
                      key={method}
                      className="bg-slate-100 text-slate-700 border-slate-300"
                    >
                      {method}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {bookmaker.min_deposit && (
              <div>
                <p className="text-slate-500 text-sm">Depot minimum</p>
                <p className="font-medium text-slate-700">{bookmaker.min_deposit}</p>
              </div>
            )}

            {bookmaker.license && (
              <div>
                <p className="text-slate-500 text-sm">Licence</p>
                <p className="font-medium text-slate-700">{bookmaker.license}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Avantages et inconvenients */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {bookmaker.pros && (
            <Card className="bg-slate-50 border-slate-200 p-6">
              <h3 className="font-display text-lg font-bold text-green-600 mb-4">Avantages</h3>
              <ul className="space-y-2">
                {(bookmaker.pros as string[]).map((pro, index) => (
                  <li key={index} className="flex items-start gap-2 text-slate-700">
                    <span className="text-green-600 mt-0.5">+</span>
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {bookmaker.cons && (
            <Card className="bg-slate-50 border-slate-200 p-6">
              <h3 className="font-display text-lg font-bold text-red-600 mb-4">Inconvenients</h3>
              <ul className="space-y-2">
                {(bookmaker.cons as string[]).map((con, index) => (
                  <li key={index} className="flex items-start gap-2 text-slate-700">
                    <span className="text-red-600 mt-0.5">-</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* CTA final */}
        <Card className="bg-emerald-50 border-emerald-200 p-8 mt-8 text-center">
          <h2 className="font-display text-2xl font-bold mb-4">
            Pret a parier avec {bookmaker.name} ?
          </h2>
          {bonusText && (
            <p className="text-emerald-600 text-lg mb-6">{bonusText}</p>
          )}
          <Link
            href={`/go/${slug}`}
            className="inline-block bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 px-12 rounded-lg transition-colors text-lg"
          >
            S&apos;inscrire maintenant
          </Link>
          <p className="text-slate-400 text-xs mt-4">
            18+ | Jouez responsablement | Les paris sportifs comportent des risques
          </p>
        </Card>

        {/* Avertissement */}
        <Card className="bg-amber-50 border-amber-200 p-4 mt-6">
          <p className="text-amber-600 text-sm">
            Les paris sportifs comportent des risques de perte financiere. Jouez de
            maniere responsable. Les offres de bonus sont soumises à des conditions de
            mise. 18+ uniquement. Ce contenu contient des liens d&apos;affiliation.
          </p>
        </Card>
      </div>
    </main>
  );
}
