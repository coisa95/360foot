import { createClient } from "@/lib/supabase";
import { Breadcrumb } from "@/components/breadcrumb";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { Card } from "@/components/ui/card";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Toutes les compétitions — Football africain et européen — 360 Foot",
  description:
    "Retrouvez toutes les compétitions de football suivies par 360 Foot : ligues africaines, championnats européens, coupes continentales et compétitions internationales.",
  alternates: { canonical: "https://360-foot.com/competitions" },
  openGraph: {
    title: "Toutes les compétitions — 360 Foot",
    description: "Ligues africaines, championnats européens, coupes continentales et internationales.",
    type: "website",
    url: "https://360-foot.com/competitions",
  },
};

/* eslint-disable @typescript-eslint/no-explicit-any */

// Categorize leagues by type
function categorize(league: any): string {
  const name = (league.name || "").toLowerCase();
  const country = (league.country || "").toLowerCase();

  // African countries
  const africanCountries = ["ivory coast", "cote d'ivoire", "côte d'ivoire", "senegal", "sénégal", "cameroon", "cameroun", "mali", "burkina faso", "benin", "bénin", "congo", "ghana", "nigeria", "egypt", "morocco", "algeria", "tunisia"];
  if (africanCountries.some((c) => country.includes(c))) return "Afrique";

  // European club competitions (Champions League, Europa, Conference)
  if (name.includes("champion") && name.includes("league")) return "Coupes européennes";
  if (name.includes("europa")) return "Coupes européennes";
  if (name.includes("conference")) return "Coupes européennes";

  // International competitions (CAN, World Cup qualifiers, friendlies)
  if (name.includes("can") || name.includes("africa")) return "Compétitions internationales";
  if (name.includes("qualif") || name.includes("world cup") || name.includes("coupe du monde")) return "Compétitions internationales";
  if (name.includes("amicaux") || name.includes("friendl")) return "Compétitions internationales";

  // European
  const europeanCountries = ["france", "england", "spain", "italy", "germany", "portugal", "netherlands", "belgium"];
  if (europeanCountries.some((c) => country.includes(c))) return "Europe";

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
  const order = ["Afrique", "Europe", "Coupes européennes", "Compétitions internationales", "Autres"];

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
          {order.filter((cat) => categories.has(cat)).map((cat) => (
            <section key={cat}>
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-1 h-5 bg-lime-400 rounded-full" />
                {cat}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.get(cat)!.map((league: any) => (
                  <Link key={league.slug} href={`/ligue/${league.slug}`}>
                    <Card className="border-gray-800 bg-dark-card p-4 hover:border-lime-500/30 transition-colors">
                      <div className="flex items-center gap-3">
                        {league.logo_url ? (
                          <Image src={league.logo_url} alt="" width={32} height={32} className="h-8 w-8 object-contain" />
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
            </section>
          ))}
        </div>

        <div className="mt-12">
          <AffiliateTrio />
        </div>
      </div>
    </main>
  );
}
