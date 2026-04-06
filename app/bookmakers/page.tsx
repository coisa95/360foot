import { createClient } from "@/lib/supabase";
import { safeJsonLd } from "@/lib/json-ld";
import { Breadcrumb } from "@/components/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Metadata } from "next";
import Link from "next/link";

export const revalidate = 21600;

const PROMO_CODES: Record<string, string> = {
  "1xbet": "1WAFU",
  melbet: "1WAFU",
  "1win": "6MAP",
  megapari: "1WAFU",
};

const TRUST_BADGES: Record<string, string[]> = {
  "1xbet": ["Recommandé", "Dispo Afrique de l'Ouest"],
  melbet: ["Bonus 200%", "Dispo Afrique de l'Ouest"],
  "1win": ["Meilleur bonus", "Dispo Afrique de l'Ouest"],
  megapari: ["Nouveau", "Dispo Afrique de l'Ouest"],
};

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

  const getBonusText = (bonusJson: Record<string, string> | null): string => {
    if (!bonusJson) return "";
    return bonusJson["CI"] || bonusJson["default"] || Object.values(bonusJson)[0] || "";
  };

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Paris sportifs" },
  ];

  return (
    <main className="min-h-screen bg-transparent text-white">
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
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-glow">Paris sportifs</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Comparez les meilleurs bookmakers disponibles dans votre pays et profitez
            des meilleurs bonus de bienvenue.
          </p>
        </div>

        {/* Disclaimer (avant CTAs pour compliance) */}
        <div className="mt-5 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3 text-center">
          <p className="text-yellow-400/90 text-xs sm:text-sm">
            <strong>18+</strong> · Les paris sportifs comportent des risques. Jouez de manière responsable.
            Bonus soumis à conditions. Aide : <a href="tel:0974751313" className="underline hover:text-yellow-300">0 974 75 13 13</a>
          </p>
        </div>

        {/* Liste des bookmakers */}
        <div className="mt-6 space-y-5">
          {bookmakers && bookmakers.length > 0 ? (
            bookmakers.map((bookmaker, idx) => {
              const promoCode = PROMO_CODES[bookmaker.slug] || null;
              const badges = TRUST_BADGES[bookmaker.slug] || [];
              return (
                <Card
                  key={bookmaker.id}
                  className="card-glow bg-white/[0.02] border-white/[0.06] p-5 sm:p-6 relative overflow-hidden"
                >
                  {/* Rang badge */}
                  {idx === 0 && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-yellow-500 text-black text-[10px] font-extrabold font-display px-3 py-1 rounded-bl-lg">
                      TOP 1
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link href={`/bookmakers/${bookmaker.slug}`}>
                          <h2 className="font-display text-lg sm:text-xl font-extrabold hover:text-emerald-400 transition-colors">
                            {bookmaker.name}
                          </h2>
                        </Link>
                        {idx < 3 && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                            #{idx + 1}
                          </Badge>
                        )}
                      </div>

                      {bookmaker.bonus_json && (
                        <p className="text-emerald-400 font-bold text-base sm:text-lg mb-2">
                          {getBonusText(bookmaker.bonus_json as Record<string, string>)}
                        </p>
                      )}

                      {/* Trust badges */}
                      {badges.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {badges.map((badge) => (
                            <span key={badge} className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400 bg-white/[0.04] border border-white/[0.06] rounded-full px-2 py-0.5">
                              <span className="text-emerald-400">&#10003;</span> {badge}
                            </span>
                          ))}
                        </div>
                      )}

                      {bookmaker.countries && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-gray-500 text-[10px]">Pays :</span>
                          {(bookmaker.countries as string[]).map((country) => (
                            <Badge
                              key={country}
                              className="bg-white/[0.04] text-gray-400 border-white/[0.06] text-[10px] px-1.5 py-0"
                            >
                              {country}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-center gap-2 shrink-0">
                      {/* Promo code */}
                      {promoCode && (
                        <div className="text-center mb-1">
                          <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-0.5">Code promo</p>
                          <span className="inline-block font-display font-extrabold text-sm tracking-wider text-amber-400 border border-dashed border-amber-400/30 bg-amber-400/5 rounded-lg px-3 py-1">
                            {promoCode}
                          </span>
                        </div>
                      )}

                      <Link
                        href={`/go/${bookmaker.slug}`}
                        className="btn-neon w-full sm:w-auto !rounded-xl !px-6 !py-3 !text-sm"
                        aria-label={`Obtenir le bonus ${bookmaker.name}`}
                      >
                        Obtenir le bonus
                      </Link>
                      <Link
                        href={`/bookmakers/${bookmaker.slug}`}
                        className="text-gray-500 hover:text-gray-300 text-[11px] transition-colors"
                      >
                        Avis détaillé {bookmaker.name}
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="card-glass p-8 text-center">
              <p className="text-gray-400">Aucun bookmaker disponible pour le moment.</p>
            </Card>
          )}
        </div>

      </div>
    </main>
  );
}
