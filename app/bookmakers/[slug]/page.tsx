import { createClient } from "@/lib/supabase";
import { Breadcrumb } from "@/components/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createClient();

  const { data: bookmaker } = await supabase
    .from("bookmakers")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!bookmaker) return { title: "Bookmaker introuvable - 360 Foot" };

  const title = `${bookmaker.name} - Avis, bonus et inscription - 360 Foot`;
  const description = `Decouvrez notre avis sur ${bookmaker.name} : bonus de bienvenue, cotes, methodes de paiement et pays disponibles.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://360-foot.com/bookmakers/${slug}`,
    },
  };
}

export default async function BookmakerPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createClient();

  const { data: bookmaker } = await supabase
    .from("bookmakers")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!bookmaker) notFound();

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Paris sportifs", href: "/bookmakers" },
    { label: bookmaker.name },
  ];

  return (
    <main className="min-h-screen bg-dark-bg text-white">
      <div className="container mx-auto px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        {/* En-tete */}
        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-lime-400">{bookmaker.name}</h1>
              {bookmaker.rating && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-gray-400">Note :</span>
                  <Badge className="bg-lime-500/20 text-lime-400 border-lime-500/30 text-lg px-3">
                    {bookmaker.rating}/5
                  </Badge>
                </div>
              )}
            </div>

            {bookmaker.affiliate_url && (
              <a
                href={bookmaker.affiliate_url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="bg-lime-500 hover:bg-lime-400 text-black font-bold py-4 px-10 rounded-lg transition-colors text-center text-lg whitespace-nowrap"
              >
                S&apos;inscrire et obtenir le bonus
              </a>
            )}
          </div>
        </Card>

        {/* Bonus */}
        {bookmaker.bonus && (
          <Card className="bg-lime-500/10 border-lime-500/30 p-6 mt-6">
            <h2 className="text-lg font-bold text-lime-400 mb-2">Bonus de bienvenue</h2>
            <p className="text-2xl font-bold text-white">{bookmaker.bonus}</p>
            {bookmaker.bonus_conditions && (
              <p className="text-gray-400 text-sm mt-2">{bookmaker.bonus_conditions}</p>
            )}
          </Card>
        )}

        {/* Description detaillee */}
        {bookmaker.description && (
          <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
            <h2 className="text-lg font-bold text-lime-400 mb-4">A propos de {bookmaker.name}</h2>
            <Separator className="bg-gray-800 mb-4" />
            <p className="text-gray-300 leading-relaxed">{bookmaker.description}</p>
          </Card>
        )}

        {/* Informations detaillees */}
        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <h2 className="text-lg font-bold text-lime-400 mb-4">Informations</h2>
          <Separator className="bg-gray-800 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bookmaker.supported_countries && (
              <div>
                <p className="text-gray-400 text-sm mb-2">Pays disponibles</p>
                <div className="flex flex-wrap gap-2">
                  {(bookmaker.supported_countries as string[]).map((country) => (
                    <Badge
                      key={country}
                      className="bg-gray-700 text-gray-300 border-gray-600"
                    >
                      {country}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {bookmaker.payment_methods && (
              <div>
                <p className="text-gray-400 text-sm mb-2">Methodes de paiement</p>
                <div className="flex flex-wrap gap-2">
                  {(bookmaker.payment_methods as string[]).map((method) => (
                    <Badge
                      key={method}
                      className="bg-gray-700 text-gray-300 border-gray-600"
                    >
                      {method}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {bookmaker.min_deposit && (
              <div>
                <p className="text-gray-400 text-sm">Depot minimum</p>
                <p className="font-medium">{bookmaker.min_deposit}</p>
              </div>
            )}

            {bookmaker.license && (
              <div>
                <p className="text-gray-400 text-sm">Licence</p>
                <p className="font-medium">{bookmaker.license}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Avantages et inconvenients */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {bookmaker.pros && (
            <Card className="bg-dark-bg border-gray-800 p-6">
              <h3 className="text-lg font-bold text-green-400 mb-4">Avantages</h3>
              <ul className="space-y-2">
                {(bookmaker.pros as string[]).map((pro, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-300">
                    <span className="text-green-400 mt-0.5">+</span>
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {bookmaker.cons && (
            <Card className="bg-dark-bg border-gray-800 p-6">
              <h3 className="text-lg font-bold text-red-400 mb-4">Inconvenients</h3>
              <ul className="space-y-2">
                {(bookmaker.cons as string[]).map((con, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-300">
                    <span className="text-red-400 mt-0.5">-</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* CTA final */}
        {bookmaker.affiliate_url && (
          <Card className="bg-lime-500/10 border-lime-500/30 p-8 mt-8 text-center">
            <h2 className="text-2xl font-bold mb-4">
              Pret a parier avec {bookmaker.name} ?
            </h2>
            {bookmaker.bonus && (
              <p className="text-lime-400 text-lg mb-6">{bookmaker.bonus}</p>
            )}
            <a
              href={bookmaker.affiliate_url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-block bg-lime-500 hover:bg-lime-400 text-black font-bold py-4 px-12 rounded-lg transition-colors text-lg"
            >
              S&apos;inscrire maintenant
            </a>
            <p className="text-gray-500 text-xs mt-4">
              18+ | Jouez responsablement | Les paris sportifs comportent des risques
            </p>
          </Card>
        )}

        {/* Avertissement */}
        <Card className="bg-yellow-500/10 border-yellow-500/30 p-4 mt-6">
          <p className="text-yellow-400 text-sm">
            Les paris sportifs comportent des risques de perte financiere. Jouez de
            maniere responsable. Les offres de bonus sont soumises a des conditions de
            mise. 18+ uniquement. Ce contenu contient des liens d&apos;affiliation.
          </p>
        </Card>
      </div>
    </main>
  );
}
