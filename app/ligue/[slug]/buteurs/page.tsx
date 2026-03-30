import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";

export const revalidate = 3600;

type Props = {
  params: Promise<{ slug: string }>;
};

interface TopPlayer {
  name: string;
  photo: string;
  nationality: string;
  team: string;
  teamLogo: string;
  goals: number;
  assists: number;
  appearances: number;
  rating: string | null;
  yellowCards: number;
  redCards: number;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createClient();

  const { data: league } = await supabase
    .from("leagues")
    .select("name")
    .eq("slug", slug)
    .single();

  if (!league) return { title: "Buteurs introuvable" };

  const title = `Meilleurs buteurs ${league.name} - Classement des buteurs`;
  const fullDesc = `Classement des meilleurs buteurs de ${league.name} : nombre de buts, passes d\u00e9cisives et matchs jou\u00e9s par joueur.`;
  const description = fullDesc.length > 155 ? fullDesc.slice(0, 152) + "..." : fullDesc;

  return {
    title,
    description,
    alternates: { canonical: `https://360-foot.com/ligue/${slug}/buteurs` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://360-foot.com/ligue/${slug}/buteurs`,
      locale: "fr_FR",
      images: [`https://360-foot.com/api/og?title=${encodeURIComponent(title)}`],
    },
    twitter: { card: "summary_large_image" as const, title, description, images: [`https://360-foot.com/api/og?title=${encodeURIComponent(title)}`] },
  };
}

export default async function TopScorersPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createClient();

  const { data: league } = await supabase
    .from("leagues")
    .select("id,name,slug")
    .eq("slug", slug)
    .single();

  if (!league) notFound();

  const { data: standingsRows } = await supabase
    .from("standings")
    .select("top_scorers_json, season, updated_at")
    .eq("league_id", league.id)
    .order("updated_at", { ascending: false })
    .limit(1);

  const scorers: TopPlayer[] = (standingsRows?.[0]?.top_scorers_json as TopPlayer[]) || [];
  const season = standingsRows?.[0]?.season || "";
  const updatedAt = standingsRows?.[0]?.updated_at;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Accueil", item: "https://360-foot.com" },
              { "@type": "ListItem", position: 2, name: "Comp\u00e9titions", item: "https://360-foot.com/competitions" },
              { "@type": "ListItem", position: 3, name: league.name, item: `https://360-foot.com/ligue/${slug}` },
              { "@type": "ListItem", position: 4, name: "Meilleurs buteurs" },
            ],
          }),
        }}
      />

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          Saison {season}
          {updatedAt && (
            <span className="ml-2">
              &middot; Mis \u00e0 jour le{" "}
              {new Date(updatedAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </p>
      </div>

      {scorers.length > 0 ? (
        <Card className="bg-dark-bg border-gray-800 overflow-x-auto">
          <table className="w-full text-xs sm:text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="text-left p-1.5 sm:p-3 w-6 sm:w-8">#</th>
                <th className="text-left p-1.5 sm:p-3 min-w-[180px]">Joueur</th>
                <th className="text-left p-1.5 sm:p-3 min-w-[120px]">\u00c9quipe</th>
                <th className="text-center p-1.5 sm:p-3 font-bold text-lime-400">Buts</th>
                <th className="text-center p-1.5 sm:p-3">PD</th>
                <th className="text-center p-1.5 sm:p-3">MJ</th>
              </tr>
            </thead>
            <tbody>
              {scorers.map((player, index) => (
                <tr
                  key={`${player.name}-${index}`}
                  className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${
                    index === 0 ? "bg-lime-400/5" : ""
                  }`}
                >
                  <td className="p-1.5 sm:p-3 text-gray-400 font-mono">
                    {index === 0 ? (
                      <span className="inline-flex w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-lime-400 text-black text-[10px] sm:text-xs font-bold items-center justify-center">
                        1
                      </span>
                    ) : (
                      index + 1
                    )}
                  </td>
                  <td className="p-1.5 sm:p-3">
                    <div className="flex items-center gap-2">
                      {player.photo && (
                        <Image
                          src={player.photo}
                          alt={player.name}
                          width={28}
                          height={28}
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover shrink-0"
                        />
                      )}
                      <div>
                        <span className="font-medium text-white">{player.name}</span>
                        {player.nationality && (
                          <p className="text-[10px] text-gray-500">{player.nationality}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-1.5 sm:p-3">
                    <div className="flex items-center gap-1.5">
                      {player.teamLogo && (
                        <Image
                          src={player.teamLogo}
                          alt={player.team}
                          width={18}
                          height={18}
                          className="w-4 h-4 sm:w-[18px] sm:h-[18px] object-contain shrink-0"
                        />
                      )}
                      <span className="text-gray-300 truncate">{player.team}</span>
                    </div>
                  </td>
                  <td className="text-center p-1.5 sm:p-3 font-bold text-lime-400 text-base sm:text-lg">
                    {player.goals}
                  </td>
                  <td className="text-center p-1.5 sm:p-3 text-gray-400">
                    {player.assists}
                  </td>
                  <td className="text-center p-1.5 sm:p-3 text-gray-400">
                    {player.appearances}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="bg-dark-bg border-gray-800 p-8 text-center">
          <p className="text-gray-400">Aucune donn\u00e9e de buteurs disponible pour cette ligue.</p>
        </Card>
      )}

      <AffiliateTrio />
    </>
  );
}
