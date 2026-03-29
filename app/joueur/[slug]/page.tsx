import { createClient } from "@/lib/supabase";
import { Breadcrumb } from "@/components/breadcrumb";
import { ArticleCard } from "@/components/article-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 900;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createClient();

  const { data: player } = await supabase
    .from("players")
    .select("name,slug,team:teams!team_id(name,slug)")
    .eq("slug", slug)
    .single() as { data: any };

  if (!player) return { title: "Joueur introuvable - 360 Foot" };

  const title = `${player.name} - Fiche joueur, stats et actualites - 360 Foot`;
  const fullDesc = `Fiche complete de ${player.name} (${player.team?.name}) : poste, nationalite, statistiques et derniers articles.`;
  const description = fullDesc.length > 155 ? fullDesc.slice(0, 152) + "..." : fullDesc;

  return {
    title,
    description,
    alternates: {
      canonical: `https://360-foot.com/joueur/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "profile",
      url: `https://360-foot.com/joueur/${slug}`,
      images: [`/api/og?title=${encodeURIComponent(title)}`],
    },
  };
}

export default async function PlayerPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createClient();

  const { data: player } = await supabase
    .from("players")
    .select("id,name,slug,position,nationality,birth_date,number,photo_url,stats_json,team_id,team:teams!team_id(name,slug,league:leagues!league_id(name,slug))")
    .eq("slug", slug)
    .single() as { data: any };

  if (!player) notFound();

  // Fetch recent matches where this player's team played
  const recentMatches = player.team_id
    ? (await supabase
        .from("matches")
        .select("slug, date, score_home, score_away, status, home_team:teams!home_team_id(name, slug), away_team:teams!away_team_id(name, slug)")
        .or(`home_team_id.eq.${player.team_id},away_team_id.eq.${player.team_id}`)
        .eq("status", "FT")
        .order("date", { ascending: false })
        .limit(5)
      ).data
    : null;

  const { data: relatedArticles } = await supabase
    .from("articles")
    .select("id,title,slug,excerpt,type,published_at,og_image_url")
    .ilike("content", `%${player.name}%`)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(5);

  const positionLabels: Record<string, string> = {
    goalkeeper: "Gardien",
    defender: "Defenseur",
    midfielder: "Milieu",
    forward: "Attaquant",
    GK: "Gardien",
    DEF: "Defenseur",
    MID: "Milieu",
    FWD: "Attaquant",
  };

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    ...(player.team
      ? [{ label: player.team.name, href: `/equipe/${player.team.slug}` }]
      : []),
    { label: player.name },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: player.name,
    nationality: player.nationality || undefined,
    birthDate: player.birth_date || undefined,
    memberOf: player.team
      ? {
          "@type": "SportsTeam",
          name: player.team.name,
        }
      : undefined,
    jobTitle: "Footballeur professionnel",
  };

  const calculateAge = (birthDate: string): number => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <main className="min-h-screen bg-dark-bg text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container mx-auto px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        {/* Fiche joueur */}
        <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex items-start gap-4">
              {player.photo_url && (
                <Image
                  src={player.photo_url}
                  alt={`Photo ${player.name}`}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-full object-cover border-2 border-lime-400/30"
                />
              )}
              <div>
              <h1 className="text-3xl font-bold text-lime-400">{player.name}</h1>
              <div className="flex flex-wrap gap-3 mt-3">
                {player.position && (
                  <Badge className="bg-lime-500/20 text-lime-400 border-lime-500/30">
                    {positionLabels[player.position] || player.position}
                  </Badge>
                )}
                {player.nationality && (
                  <Badge className="bg-gray-700 text-gray-300 border-gray-600">
                    {player.nationality}
                  </Badge>
                )}
                {player.birth_date && (
                  <Badge className="bg-gray-700 text-gray-300 border-gray-600">
                    {calculateAge(player.birth_date)} ans
                  </Badge>
                )}
              </div>
              </div>
            </div>
            {player.team && (
              <Link href={`/equipe/${player.team.slug}`}>
                <Badge className="bg-lime-500/20 text-lime-400 border-lime-500/30 text-base px-4 py-1">
                  {player.team.name}
                </Badge>
              </Link>
            )}
          </div>

          <Separator className="bg-gray-800 my-6" />

          {/* Informations detaillees */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {player.position && (
              <div>
                <p className="text-gray-400 text-sm">Poste</p>
                <p className="font-medium">{positionLabels[player.position] || player.position}</p>
              </div>
            )}
            {player.nationality && (
              <div>
                <p className="text-gray-400 text-sm">Nationalite</p>
                <p className="font-medium">{player.nationality}</p>
              </div>
            )}
            {player.birth_date && (
              <div>
                <p className="text-gray-400 text-sm">Date de naissance</p>
                <p className="font-medium">
                  {new Date(player.birth_date).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
            {player.number && (
              <div>
                <p className="text-gray-400 text-sm">Numero</p>
                <p className="font-medium text-lime-400 text-xl">{player.number}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Statistiques */}
        {player.stats_json && (
          <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
            <h2 className="text-lg font-bold text-lime-400 mb-4">Statistiques</h2>
            <Separator className="bg-gray-800 mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center">
              {Object.entries(player.stats_json as Record<string, number>).map(
                ([key, value]) => {
                  const statLabels: Record<string, string> = {
                    goals: "Buts",
                    assists: "Passes decisives",
                    appearances: "Apparitions",
                    minutes: "Minutes",
                    yellow_cards: "Cartons jaunes",
                    red_cards: "Cartons rouges",
                    clean_sheets: "Clean sheets",
                    saves: "Arrets",
                  };
                  return (
                    <div key={key}>
                      <p className="text-gray-400 text-sm">
                        {statLabels[key] || key.replace(/_/g, " ")}
                      </p>
                      <p className="text-2xl font-bold text-lime-400">{value}</p>
                    </div>
                  );
                }
              )}
            </div>
          </Card>
        )}

        {/* Derniers matchs de l'équipe */}
        {recentMatches && recentMatches.length > 0 && (
          <Card className="bg-dark-bg border-gray-800 p-6 mt-6">
            <h2 className="text-lg font-bold text-lime-400 mb-4">Derniers matchs</h2>
            <div className="space-y-2">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {recentMatches.map((m: any) => (
                <Link key={m.slug} href={`/match/${m.slug}`} className="flex items-center justify-between rounded-lg bg-dark-card px-3 py-2 text-sm hover:bg-gray-800/50 transition-colors">
                  <span className="text-xs text-gray-500 w-20">
                    {new Date(m.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </span>
                  <span className="flex-1 text-right text-white">{m.home_team?.name}</span>
                  <span className="mx-3 font-bold text-lime-400">{m.score_home} - {m.score_away}</span>
                  <span className="flex-1 text-white">{m.away_team?.name}</span>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {/* Articles mentionnant le joueur */}
        {relatedArticles && relatedArticles.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-lime-400 mb-4">
              Articles mentionnant {player.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedArticles.map((article: Record<string, unknown>) => (
                <ArticleCard
                  key={article.id as string}
                  slug={article.slug as string}
                  title={article.title as string}
                  excerpt={(article.excerpt as string) || ""}
                  type={article.type as string}
                  publishedAt={article.published_at as string}
                  imageUrl={(article.og_image_url as string) || null}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
