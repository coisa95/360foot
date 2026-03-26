import { createClient } from "@/lib/supabase";
import { Breadcrumb } from "@/components/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { Metadata } from "next";
import Link from "next/link";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Bons Plans - Guides & Comparateur de bookmakers",
  description:
    "Guides complets sur les paris sportifs et comparateur des meilleurs bookmakers en Afrique. Bonus, stratégies et conseils pour parier sur le football.",
  alternates: {
    canonical: "https://360-foot.com/bons-plans",
  },
  openGraph: {
    title: "Bons Plans - Guides & Comparateur de bookmakers - 360 Foot",
    description:
      "Guides complets sur les paris sportifs et comparateur des meilleurs bookmakers en Afrique.",
    type: "website",
    url: "https://360-foot.com/bons-plans",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bons Plans - Guides & Comparateur de bookmakers - 360 Foot",
    description: "Guides et comparateur des meilleurs bookmakers en Afrique.",
  },
};

export default async function BonsPlansPage() {
  const supabase = createClient();

  // Fetch guide articles
  const { data: guides } = await supabase
    .from("articles")
    .select("id, title, slug, excerpt, published_at, tags")
    .eq("type", "guide")
    .order("published_at", { ascending: false });

  // Fetch bookmakers
  const { data: bookmakers } = await supabase
    .from("bookmakers")
    .select("*")
    .eq("active", true)
    .order("priority", { ascending: true });

  const getBonusText = (bonusJson: Record<string, string> | null): string => {
    if (!bonusJson) return "";
    return bonusJson["CI"] || bonusJson["default"] || Object.values(bonusJson)[0] || "";
  };

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Bons Plans" },
  ];

  return (
    <main className="min-h-screen bg-dark-bg text-white">
      <div className="container mx-auto px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-lime-400">Bons Plans</h1>
          <p className="text-gray-400 mt-1">
            Guides, conseils et comparateur de bookmakers pour parier sur le football en Afrique.
          </p>
        </div>

        {/* Section: Nos Guides */}
        <section className="mt-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-1 rounded-full bg-lime-400" />
            <h2 className="text-2xl font-bold">Nos guides</h2>
          </div>

          {guides && guides.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((guide) => (
                <Link key={guide.id} href={`/actu/${guide.slug}`}>
                  <Card className="group h-full bg-dark-card/80 border-dark-border/50 p-5 transition-all hover:border-lime-500/40 hover:bg-dark-card">
                    <div className="flex flex-col h-full">
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <Badge className="bg-lime-500/20 text-lime-400 border-lime-500/30 text-[10px]">
                          Guide
                        </Badge>
                        {guide.tags?.slice(0, 2).map((tag: string) => (
                          <Badge
                            key={tag}
                            className="bg-gray-700/50 text-gray-400 border-gray-600/50 text-[10px]"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <h3 className="font-semibold text-white group-hover:text-lime-400 transition-colors line-clamp-2 mb-2">
                        {guide.title}
                      </h3>
                      {guide.excerpt && (
                        <p className="text-sm text-gray-400 line-clamp-3 flex-1">
                          {guide.excerpt}
                        </p>
                      )}
                      <div className="mt-3 pt-3 border-t border-dark-border/30">
                        <span className="text-xs text-lime-400 font-medium group-hover:underline">
                          Lire le guide &rarr;
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="bg-dark-card/80 border-dark-border/50 p-8 text-center">
              <p className="text-gray-400">Aucun guide disponible pour le moment.</p>
            </Card>
          )}
        </section>

        {/* Affiliate Trio */}
        <div className="mt-10">
          <AffiliateTrio />
        </div>

        {/* Section: Comparateur de bookmakers */}
        <section className="mt-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-1 rounded-full bg-lime-400" />
            <h2 className="text-2xl font-bold">Comparateur de bookmakers</h2>
          </div>

          <p className="text-gray-400 mb-6">
            Comparez les meilleurs bookmakers disponibles dans votre pays et profitez
            des meilleurs bonus de bienvenue.
          </p>

          {/* Avertissement */}
          <Card className="bg-yellow-500/10 border-yellow-500/30 p-4 mb-6">
            <p className="text-yellow-400 text-sm">
              Les paris sportifs comportent des risques. Jouez de maniere responsable.
              Les offres de bonus sont soumises a conditions. 18+ uniquement.
            </p>
          </Card>

          <div className="space-y-6">
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
                          <h3 className="text-xl font-bold hover:text-lime-400 transition-colors">
                            {bookmaker.name}
                          </h3>
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
                      {bookmaker.affiliate_url && (
                        <a
                          href={bookmaker.affiliate_url}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="bg-lime-500 hover:bg-lime-400 text-black font-bold py-3 px-8 rounded-lg transition-colors text-center whitespace-nowrap"
                        >
                          Obtenir le bonus
                        </a>
                      )}
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
        </section>
      </div>
    </main>
  );
}
