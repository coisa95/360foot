import { createAnonClient } from "@/lib/supabase";
import { Breadcrumb } from "@/components/breadcrumb";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { Card } from "@/components/ui/card";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 3600;

const TITLE = "Équipes de football — Effectifs, stats et actualités";
const DESCRIPTION =
  "Découvrez les équipes africaines et européennes : effectifs, statistiques, calendriers, actualités. Ligue 1 Côte d'Ivoire, Premier League, Champions League...";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://360-foot.com/equipe" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "https://360-foot.com/equipe",
    locale: "fr_FR",
    images: [`https://360-foot.com/api/og?title=${encodeURIComponent(TITLE)}`],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`https://360-foot.com/api/og?title=${encodeURIComponent(TITLE)}`],
  },
};

type TeamRow = {
  slug: string;
  name: string;
  logo_url: string | null;
  country: string | null;
  league: { name: string; slug: string } | null;
};

export default async function EquipeIndexPage() {
  const supabase = createAnonClient();

  const { data } = await supabase
    .from("teams")
    .select("slug,name,logo_url,country,league:leagues!league_id(name,slug)")
    .not("slug", "is", null)
    .order("name", { ascending: true })
    .limit(300);

  const teams = (data ?? []) as unknown as TeamRow[];

  // Group by country (fallback: "Autres")
  const groups = new Map<string, TeamRow[]>();
  for (const t of teams) {
    const key = (t.country && t.country.trim()) || "Autres";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  // Order countries by size (largest first), keep "Autres" last
  const orderedCountries = Array.from(groups.keys())
    .filter((c) => c !== "Autres")
    .sort((a, b) => (groups.get(b)!.length - groups.get(a)!.length) || a.localeCompare(b));
  if (groups.has("Autres")) orderedCountries.push("Autres");

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Équipes" },
  ];

  return (
    <main className="min-h-screen text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        <h1 className="font-display mt-6 text-3xl font-bold md:text-4xl">
          <span className="text-emerald-600">Équipes de football</span> : effectifs, stats et actualités
        </h1>
        <p className="mt-2 text-slate-500 text-sm max-w-2xl">
          Effectifs, statistiques, calendriers et actualités des clubs africains
          et européens.
        </p>

        {teams.length === 0 ? (
          <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-400">Aucune équipe à afficher.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {orderedCountries.map((country) => (
              <section key={country}>
                <h2 className="font-display text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 bg-emerald-500 rounded-full" />
                  {country}
                  <span className="text-xs font-normal text-slate-400">
                    ({groups.get(country)!.length})
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {groups.get(country)!.map((team) => (
                    <Link key={team.slug} href={`/equipe/${team.slug}`}>
                      <Card className="border-slate-200 bg-white p-4 hover:border-emerald-200 transition-colors">
                        <div className="flex items-center gap-3">
                          {team.logo_url ? (
                            <Image
                              src={team.logo_url}
                              alt={`Logo ${team.name}`}
                              width={40}
                              height={40}
                              className="h-10 w-10 object-contain shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center text-xs text-slate-400 shrink-0">
                              {team.name?.charAt(0) ?? "?"}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900 text-sm truncate">
                              {team.name}
                            </p>
                            {team.league?.name && (
                              <p className="text-xs text-slate-400 truncate">
                                {team.league.name}
                              </p>
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
        )}

        <div className="mt-12">
          <AffiliateTrio />
        </div>
      </div>
    </main>
  );
}
