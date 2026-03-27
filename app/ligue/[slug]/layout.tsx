import { createClient } from "@/lib/supabase";
import { Breadcrumb } from "@/components/breadcrumb";
import LeagueTabs from "@/components/league-tabs";
import { notFound } from "next/navigation";

/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any */

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export default async function LeagueLayout({ params, children }: Props) {
  const { slug } = await params;
  const supabase = createClient();

  const { data: league } = await supabase
    .from("leagues")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!league) notFound();

  // Determine season display
  const { data: standingsRow } = await supabase
    .from("standings")
    .select("season")
    .eq("league_id", league.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  const season = standingsRow?.season || new Date().getFullYear().toString();
  const seasonDisplay = season.length === 4 ? `${season}/${parseInt(season) + 1}` : season;

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: league.name, href: `/ligue/${slug}` },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    name: league.name,
    sport: "Football",
    location: { "@type": "Place", name: league.country },
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {/* Flashscore-style Hero */}
      <div className="border-b border-dark-border bg-dark-card/50">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center gap-4">
            {league.logo_url && (
              <img
                src={league.logo_url}
                alt={league.name}
                className="h-14 w-14 object-contain"
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                {league.country_code && (
                  <span className="text-sm text-gray-500">{league.country}</span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                {league.name}
              </h1>
              <span className="text-sm text-gray-500">{seasonDisplay}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="container mx-auto px-4">
          <LeagueTabs leagueSlug={slug} />
        </div>
      </div>

      {/* Tab content */}
      <div className="container mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
}
