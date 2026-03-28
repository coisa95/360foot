import { createClient } from "@/lib/supabase";
import { Breadcrumb } from "@/components/breadcrumb";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { CollapsibleSection } from "@/components/collapsible-section";
import { Card } from "@/components/ui/card";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Compétitions football — Afrique et Europe — 360 Foot",
  description:
    "Toutes les compétitions de football sur 360 Foot : ligues africaines, championnats européens, coupes continentales et internationales.",
  alternates: { canonical: "https://360-foot.com/competitions" },
  openGraph: {
    title: "Compétitions football — 360 Foot",
    description: "Ligues africaines, championnats européens, coupes continentales et internationales.",
    type: "website",
    url: "https://360-foot.com/competitions",
    images: ["/api/og?title=Comp%C3%A9titions"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Compétitions football — 360 Foot",
    description: "Ligues africaines, championnats européens, coupes continentales et internationales.",
  },
};

/* eslint-disable @typescript-eslint/no-explicit-any */

// Categorize leagues by type — name-based rules first (cups/international), then country-based (domestic)
function categorize(league: any): string {
  const name = (league.name || "").toLowerCase();
  const country = (league.country || "").toLowerCase();

  // 1) Continental club competitions (must come before country checks)
  if (name.includes("caf champions") || name.includes("confédération caf") || name.includes("confederation cup")) return "Compétitions continentales";
  if (name.includes("champions league") || name.includes("europa") || name.includes("conference league")) return "Compétitions continentales";
  if (name.includes("libertadores") || name.includes("sudamericana") || name.includes("copa sudamericana")) return "Compétitions continentales";
  if (name.includes("concacaf champions") || name.includes("concacaf league")) return "Compétitions continentales";
  if (name.includes("afc champions") || name.includes("afc cup")) return "Compétitions continentales";

  // 2) International competitions (sélections — must come before country checks)
  if (name === "can" || name.includes("coupe d'afrique")) return "Compétitions internationales";
  if (name === "euro" || name.includes("euro championship")) return "Compétitions internationales";
  if (name.includes("copa america")) return "Compétitions internationales";
  if (name.includes("coupe d'asie") || name.includes("asian cup")) return "Compétitions internationales";
  if (name.includes("concacaf gold cup") || name.includes("gold cup")) return "Compétitions internationales";
  if (name.includes("qualif") || name.includes("world cup") || name.includes("coupe du monde")) return "Compétitions internationales";
  if (name.includes("amicaux") || name.includes("friendl")) return "Compétitions internationales";

  // 3) Domestic leagues by region
  // Afrique
  const africanCountries = ["ivory coast", "cote d'ivoire", "côte d'ivoire", "senegal", "sénégal", "cameroon", "cameroun", "mali", "burkina faso", "benin", "bénin", "congo", "ghana", "nigeria", "egypt", "égypte", "morocco", "maroc", "algeria", "algérie", "tunisia", "tunisie", "afrique", "guinée", "guinea", "gabon"];
  if (africanCountries.some((c) => country.includes(c))) return "Afrique";

  // Europe
  const europeanCountries = ["france", "england", "angleterre", "spain", "espagne", "italy", "italie", "germany", "allemagne", "portugal", "netherlands", "pays-bas", "belgium", "belgique", "europe"];
  if (europeanCountries.some((c) => country.includes(c))) return "Europe";

  // Amérique
  const americanCountries = ["usa", "états-unis", "amérique", "amérique du sud", "mexico", "mexique", "brazil", "brésil", "argentina", "argentine", "colombia", "colombie"];
  if (americanCountries.some((c) => country.includes(c))) return "Amérique";

  // Asie
  const asianCountries = ["asie", "arabie saoudite", "saudi", "japan", "japon", "china", "chine", "south korea", "cor��e", "qatar", "uae", "émirats"];
  if (asianCountries.some((c) => country.includes(c))) return "Asie";

  return "Autres";
}

export default async function CompetitionsPage() {
  const supabase = createClient();

  const { data: leagues } = await supabase
    .from("leagues")
    .select("name, slug, logo_url, country")
    .order("name");

  // Group by category
  const categories = new Map<string, any[]>();
  const order = ["Afrique", "Europe", "Amérique", "Asie", "Compétitions continentales", "Compétitions internationales", "Autres"];

  for (const league of leagues || []) {
    const cat = categorize(league);
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(league);
  }

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Compétitions" },
  ];

  return (
    <main className="min-h-screen bg-dark-bg text-white">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        <h1 className="mt-6 text-3xl font-bold md:text-4xl">
          <span className="text-lime-400">Compétitions</span>
        </h1>
        <p className="mt-2 text-gray-400 text-sm">
          Toutes les compétitions suivies par 360 Foot
        </p>

        <div className="mt-8 space-y-8">
          {order.filter((cat) => categories.has(cat)).map((cat) => {
            const collapsible = ["Compétitions continentales", "Compétitions internationales", "Autres"].includes(cat);
            const grid = (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.get(cat)!.map((league: any) => (
                  <Link key={league.slug} href={`/ligue/${league.slug}`}>
                    <Card className="border-gray-800 bg-dark-card p-4 hover:border-lime-500/30 transition-colors">
                      <div className="flex items-center gap-3">
                        {league.logo_url ? (
                          <Image src={league.logo_url} alt={`Logo ${league.name}`} width={32} height={32} className="h-8 w-8 object-contain" />
                        ) : (
                          <div className="h-8 w-8 rounded bg-gray-700 flex items-center justify-center text-xs text-gray-500">
                            {league.name?.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white text-sm truncate">{league.name}</p>
                          {league.country && (
                            <p className="text-xs text-gray-500">{league.country}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            );

            if (collapsible) {
              return (
                <CollapsibleSection key={cat} title={cat}>
                  {grid}
                </CollapsibleSection>
              );
            }

            return (
              <section key={cat}>
                <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 bg-lime-400 rounded-full" />
                  {cat}
                </h2>
                {grid}
              </section>
            );
          })}
        </div>

        <div className="mt-12">
          <AffiliateTrio />
        </div>
      </div>
    </main>
  );
}
