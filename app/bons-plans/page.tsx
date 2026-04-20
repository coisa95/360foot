import { createAnonClient } from "@/lib/supabase";
import { Breadcrumb } from "@/components/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { Metadata } from "next";
import Link from "next/link";

export const revalidate = 21600;

export const metadata: Metadata = {
  title: "Bons Plans — Guides et comparateur bookmakers",
  description:
    "Comparateur des meilleurs bookmakers en Afrique : bonus, cotes, stratégies et conseils pour parier sur le football.",
  alternates: {
    canonical: "https://360-foot.com/bons-plans",
  },
  openGraph: {
    title: "Bons Plans - Guides & Comparateur de bookmakers - 360 Foot",
    description:
      "Guides complets sur les paris sportifs et comparateur des meilleurs bookmakers en Afrique.",
    type: "website",
    url: "https://360-foot.com/bons-plans",
    locale: "fr_FR",
    images: ["https://360-foot.com/api/og?title=Bons%20Plans%20-%20Guides%20%26%20Comparateur%20de%20bookmakers"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bons Plans - Guides & Comparateur de bookmakers - 360 Foot",
    description: "Guides et comparateur des meilleurs bookmakers en Afrique.",
    images: ["https://360-foot.com/api/og?title=Bons%20Plans%20-%20Guides%20%26%20Comparateur%20de%20bookmakers"],
  },
};

export default async function BonsPlansPage() {
  const supabase = createAnonClient();

  // Fetch guide articles
  const { data: guides } = await supabase
    .from("articles")
    .select("id, title, slug, excerpt, published_at, tags")
    .eq("type", "guide")
    .order("published_at", { ascending: false });

  // Fetch bookmakers
  const { data: bookmakers } = await supabase
    .from("bookmakers")
    .select("id,name,slug,priority,bonus_json,countries,affiliate_url")
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
    <main className="min-h-screen bg-transparent text-slate-900">
      <div className="container mx-auto px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        <div className="mt-6">
          <h1 className="font-display text-3xl font-bold text-emerald-600">Bons Plans</h1>
          <p className="text-slate-500 mt-1">
            Guides, conseils et comparateur de bookmakers pour parier sur le football en Afrique.
          </p>
        </div>

        {/* Section: Nos Guides */}
        <section className="mt-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-1 rounded-full bg-emerald-500" />
            <h2 className="font-display text-2xl font-bold">Nos guides</h2>
          </div>

          {guides && guides.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((guide) => (
                <Link key={guide.id} href={`/actu/${guide.slug}`}>
                  <Card className="group h-full bg-white border-slate-200 p-5 transition-all hover:border-emerald-500/40 hover:card-glass">
                    <div className="flex flex-col h-full">
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px]">
                          Guide
                        </Badge>
                        {guide.tags?.slice(0, 2).map((tag: string) => (
                          <Badge
                            key={tag}
                            className="bg-slate-100 text-slate-500 border-slate-300/50 text-[10px]"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <h3 className="font-display font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2 mb-2">
                        {guide.title}
                      </h3>
                      {guide.excerpt && (
                        <p className="text-sm text-slate-500 line-clamp-3 flex-1">
                          {guide.excerpt}
                        </p>
                      )}
                      <div className="mt-3 pt-3 border-t border-slate-200/30">
                        <span className="text-xs text-emerald-600 font-medium group-hover:underline">
                          Lire le guide &rarr;
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="bg-white border-slate-200 p-8 text-center">
              <p className="text-slate-500">Aucun guide disponible pour le moment.</p>
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
            <div className="h-8 w-1 rounded-full bg-emerald-500" />
            <h2 className="font-display text-2xl font-bold">Comparateur de bookmakers</h2>
          </div>

          <p className="text-slate-500 mb-6">
            Comparez les meilleurs bookmakers disponibles dans votre pays et profitez
            des meilleurs bonus de bienvenue.
          </p>

          {/* Avertissement */}
          <Card className="bg-amber-50 border-amber-200 p-4 mb-6">
            <p className="text-amber-600 text-sm">
              Les paris sportifs comportent des risques. Jouez de manière responsable.
              Les offres de bonus sont soumises à conditions. 18+ uniquement.
            </p>
          </Card>

          <div className="space-y-6">
            {bookmakers && bookmakers.length > 0 ? (
              bookmakers.map((bookmaker) => (
                <Card
                  key={bookmaker.id}
                  className="bg-slate-50 border-slate-200 p-6 hover:border-emerald-200 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link href={`/bookmakers/${bookmaker.slug}`}>
                          <h3 className="font-display text-xl font-bold hover:text-emerald-600 transition-colors">
                            {bookmaker.name}
                          </h3>
                        </Link>
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200">
                          #{bookmaker.priority}
                        </Badge>
                      </div>

                      {bookmaker.bonus_json && (
                        <p className="text-emerald-600 font-semibold text-lg mb-2">
                          {getBonusText(bookmaker.bonus_json as Record<string, string>)}
                        </p>
                      )}

                      {bookmaker.countries && (
                        <div className="flex flex-wrap gap-2">
                          <span className="text-slate-400 text-xs">Disponible :</span>
                          {(bookmaker.countries as string[]).map((country) => (
                            <Badge
                              key={country}
                              className="bg-slate-100 text-slate-700 border-slate-300 text-xs"
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
                        className="bg-emerald-500 hover:bg-emerald-500 text-black font-bold py-3 px-8 rounded-lg transition-colors text-center whitespace-nowrap"
                      >
                        Obtenir le bonus
                      </Link>
                      <Link
                        href={`/bookmakers/${bookmaker.slug}`}
                        className="text-slate-500 hover:text-emerald-600 text-sm transition-colors"
                      >
                        Voir l&apos;avis complet
                      </Link>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="bg-slate-50 border-slate-200 p-8 text-center">
                <p className="text-slate-500">Aucun bookmaker disponible pour le moment.</p>
              </Card>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
