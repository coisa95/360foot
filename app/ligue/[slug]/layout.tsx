import { createAnonClient } from "@/lib/supabase";
import { safeJsonLd } from "@/lib/json-ld";
import { Breadcrumb } from "@/components/breadcrumb";
import LeagueTabs from "@/components/league-tabs";
import Image from "next/image";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const revalidate = 900;

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export default async function LeagueLayout({ params, children }: Props) {
  const { slug } = await params;
  const supabase = createAnonClient();

  const { data: league } = await supabase
    .from("leagues")
    .select("id,name,slug,country,country_code,logo_url")
    .eq("slug", slug)
    .single();

  if (!league) {
    // Opt out of ISR cache for 404 — otherwise Next.js caches the
    // not-found response with HTTP 200, not 404.
    headers();
    notFound();
  }

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
    { label: "Compétitions", href: "/competitions" },
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
    <div className="min-h-screen text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {/* Flashscore-style Hero */}
      <div className="border-b border-slate-200 bg-slate-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-5">
          <div className="flex items-center gap-3">
            {league.logo_url && (
              <Image
                src={league.logo_url}
                alt={`Logo ${league.name}`}
                width={56}
                height={56}
                className="h-10 w-10 sm:h-14 sm:w-14 object-contain"
              />
            )}
            <div>
              {league.country_code && (
                <span className="text-xs sm:text-sm text-slate-400">{league.country}</span>
              )}
              <h1 className="font-display text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900">
                {league.name}
              </h1>
              <span className="text-xs sm:text-sm text-slate-400">{seasonDisplay}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="container mx-auto px-2 sm:px-4">
          <LeagueTabs leagueSlug={slug} />
        </div>
      </div>

      {/* Tab content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {children}
      </div>
    </div>
  );
}
