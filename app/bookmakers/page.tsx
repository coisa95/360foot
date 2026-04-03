import { createClient } from "@/lib/supabase";
import { safeJsonLd } from "@/lib/json-ld";
import { Breadcrumb } from "@/components/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Metadata } from "next";
import Link from "next/link";

export const revalidate = 21600;

export const metadata: Metadata = {
  title: "Paris sportifs - Comparateur de bookmakers",
  description:
    "Comparez les meilleurs bookmakers pour parier sur le football africain. Bonus de bienvenue, cotes et avis sur les sites de paris sportifs.",
  alternates: {
    canonical: "https://360-foot.com/bookmakers",
  },
  openGraph: {
    title: "Paris sportifs - Comparateur de bookmakers - 360 Foot",
    description:
      "Comparez les meilleurs bookmakers pour parier sur le football africain. Bonus de bienvenue, cotes et avis sur les sites de paris sportifs.",
    type: "website",
    url: "https://360-foot.com/bookmakers",
    locale: "fr_FR",
    images: ["https://360-foot.com/api/og?title=Paris%20sportifs%20-%20Comparateur%20de%20bookmakers"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Paris sportifs - Comparateur de bookmakers - 360 Foot",
    description:
      "Comparez les meilleurs bookmakers pour parier sur le football africain. Bonus de bienvenue, cotes et avis.",
    images: ["https://360-foot.com/api/og?title=Paris%20sportifs%20-%20Comparateur%20de%20bookmakers"],
  },
};

export default async function BookmakersPage() {
  const supabase = createClient();

  const { data: bookmakers } = await supabase
    .from("bookmakers")
    .select("id,name,slug,priority,bonus_json,countries,affiliate_url")
    .eq("active", true)
    .order("priority", { ascending: true });

  // Helper to get bonus text for display
  const getBonusText = (bonusJson: Record<string, string> | null): string => {
    if (!bonusJson) return "";
    return bonusJson["CI"] || bonusJson["default"] || Object.values(bonusJson)[0] || "";
  };

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Paris sportifs" },
  ];

  return (
    <main className="min-h-screen bg-dark-bg text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Comparateur de Bookmakers — 360 Foot",
            description: "Comparatif des meilleurs bookmakers football en Afrique.",
            url: "https://360-foot.com/bookmakers",
          }),
        }}
      />
      <div className="container mx-auto px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-lime-400">Paris sportifs</h1>
          <p className="text-gray-400 mt-1">
            Comparez les meilleurs bookmakers disponibles dans votre pays et profitez
            des meilleurs bonus de bienvenue.
          </p>
        </div>

        {/* Avertissement */}
        <Card className="bg-yellow-500/10 border-yellow-500/30 p-4 mt-6">
          <p className="text-yellow-400 text-sm">
            Les paris sportifs comportent des risques. Jouez de maniere responsable.
            Les offres de bonus sont soumises a conditions. 18+ uniquement.
          </p>
        </Card>

        {/* Liste des bookmakers */}
        <div className="mt-8 space-y-6">
          {bookmakers && bookmakers.length > 0 ? (
            bookmakers.map((bookmaker) => (
              <Card
                key={bookmaker.id}
                className="bg-dark-bg border-gray-800 p-6 hover:border-lime-500/30 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link href={`/bookmakers/${bookmaker.slug}`}>
                        <h2 className="text-xl font-bold hover:text-lime-400 transition-colors">
                          {bookmaker.name}
                        </h2>
                      </Link>
                      <Badge className="bg-lime-500/20 text-lime-400 border-lime-500/30">
                        #{bookmaker.priority}
                      </Badge>
                    </div>

                    {bookmaker.bonus_json && (
                      <p className="text-lime-400 font-semibold text-lg mb-2">
                        {getBonusText(bookmaker.bonus_json as Record<string, string>)}
                      </p>
                    )}

                    {bookmaker.countries && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-gray-500 text-xs">Disponible :</span>
                        {(bookmaker.countries as string[]).map((country) => (
                          <Badge
                            key={country}
                            className="bg-gray-700 text-gray-300 border-gray-600 text-xs"
                          >
                            {country}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <Link
                      href={`/go/${bookmaker.slug}`}
                      className="bg-lime-500 hover:bg-lime-400 text-black font-bold py-3 px-8 rounded-lg transition-colors text-center whitespace-nowrap"
                    >
                      Obtenir le bonus
                    </Link>
                    <Link
                      href={`/bookmakers/${bookmaker.slug}`}
                      className="text-gray-400 hover:text-lime-400 text-sm transition-colors"
                    >
                      Voir l&apos;avis complet
                    </Link>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="bg-dark-bg border-gray-800 p-8 text-center">
              <p className="text-gray-400">Aucun bookmaker disponible pour le moment.</p>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
