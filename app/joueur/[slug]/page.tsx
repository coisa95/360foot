import { createClient } from "@/lib/supabase";
import { Breadcrumb } from "@/components/breadcrumb";
import { ArticleCard } from "@/components/article-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createClient();

  const { data: player } = await supabase
    .from("players")
    .select("*, team:teams!team_id(*, league:leagues!league_id(*))")
    .eq("slug", slug)
    .single();

  if (!player) return { title: "Joueur introuvable - 360 Foot" };

  const title = `${player.name} - Fiche joueur, stats et actualites - 360 Foot`;
  const description = `Fiche complete de ${player.name} (${player.team?.name}) : poste, nationalite, statistiques et derniers articles.`;

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
    },
  };
}

export default async function PlayerPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createClient();

  const { data: player } = await supabase
    .from("players")
    .select("*, team:teams!team_id(*, league:leagues!league_id(*))")
    .eq("slug", slug)
    .single();

  if (!player) notFound();

  const { data: relatedArticles } = await supabase
    .from("articles")
    .select("*")
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
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
