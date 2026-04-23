import { createAnonClient } from "@/lib/supabase";
import { safeJsonLd } from "@/lib/json-ld";
import { getCspNonce } from "@/lib/csp-nonce";
import { noindexIf, hasJsonContent } from "@/lib/seo-helpers";
import { Breadcrumb } from "@/components/breadcrumb";
import { ArticleCard } from "@/components/article-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAnonClient();

  const { data: player } = await supabase
    .from("players")
    .select("name,slug,stats_json,team:teams!team_id(name,slug)")
    .eq("slug", slug)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .single() as { data: any };

  if (!player) {
    // Opt out of ISR cache for 404 — otherwise Next.js caches the
    // not-found response with HTTP 200, not 404.
    headers();
    notFound();
  }

  const teamName = player.team?.name || "";
  const title = `${player.name}${teamName ? ` (${teamName})` : ""} — Stats, profil et actu`;
  const fullDesc = `Tout sur ${player.name}${teamName ? ` de ${teamName}` : ""} : statistiques détaillées, fiche complète, parcours et dernières actualités.`;
  const description = fullDesc.length > 155 ? fullDesc.slice(0, 152) + "..." : fullDesc;

  // Pages de joueur sans stats_json ET sans article associé = thin content
  // (juste nom + équipe). noindex pour économiser le crawl budget Google et
  // éviter les signalements "Explorée, actuellement non indexée" dans la
  // Search Console. On garde l'indexation si au moins un article parle du
  // joueur — dans ce cas la page sert de hub vers ce contenu.
  const hasStats = hasJsonContent(player.stats_json);
  let hasArticle = false;
  if (!hasStats && player.name) {
    const { count } = await supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .ilike("title", `%${player.name}%`)
      .not("published_at", "is", null);
    hasArticle = (count ?? 0) > 0;
  }
  const robots = noindexIf(!hasStats && !hasArticle);

  return {
    title,
    description,
    robots,
    alternates: {
      canonical: `https://360-foot.com/joueur/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "profile",
      url: `https://360-foot.com/joueur/${slug}`,
      locale: "fr_FR",
      images: [`https://360-foot.com/api/og?title=${encodeURIComponent(title)}`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`https://360-foot.com/api/og?title=${encodeURIComponent(title)}`],
    },
  };
}

export default async function PlayerPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createAnonClient();

  const { data: player } = await supabase
    .from("players")
    .select("id,name,slug,position,nationality,birth_date,number,photo_url,stats_json,team_id,team:teams!team_id(name,slug,league:leagues!league_id(name,slug))")
    .eq("slug", slug)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .single() as { data: any };

  if (!player) {
    // Opt out of ISR cache for 404 — otherwise Next.js caches the
    // not-found response with HTTP 200, not 404.
    headers();
    notFound();
  }

  // Parallelize independent queries
  const [matchesRes, articlesRes] = await Promise.all([
    player.team_id
      ? supabase
          .from("matches")
          .select("slug, date, score_home, score_away, status, home_team:teams!home_team_id(name, slug), away_team:teams!away_team_id(name, slug)")
          .or(`home_team_id.eq.${player.team_id},away_team_id.eq.${player.team_id}`)
          .eq("status", "FT")
          .order("date", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: null }),
    supabase
      .from("articles")
      .select("id,title,slug,excerpt,type,published_at,og_image_url")
      .ilike("title", `%${player.name}%`)
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(5),
  ]);
  const recentMatches = matchesRes.data;
  const relatedArticles = articlesRes.data;

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
    <main className="min-h-screen bg-transparent text-slate-900">
      <script
        type="application/ld+json"
        nonce={getCspNonce()}
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      <div className="container mx-auto px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        {/* Fiche joueur */}
        <Card className="bg-slate-50 border-slate-200 p-6 mt-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex items-start gap-4">
              {player.photo_url && (
                <Image
                  src={player.photo_url}
                  alt={`Photo ${player.name}`}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-full object-cover border-2 border-emerald-200"
                />
              )}
              <div>
              <h1 className="font-display text-3xl font-bold text-emerald-600">{player.name}</h1>
              <div className="flex flex-wrap gap-3 mt-3">
                {player.position && (
                  <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200">
                    {positionLabels[player.position] || player.position}
                  </Badge>
                )}
                {player.nationality && (
                  <Badge className="bg-slate-100 text-slate-700 border-slate-300">
                    {player.nationality}
                  </Badge>
                )}
                {player.birth_date && (
                  <Badge className="bg-slate-100 text-slate-700 border-slate-300">
                    {calculateAge(player.birth_date)} ans
                  </Badge>
                )}
              </div>
              </div>
            </div>
            {player.team && (
              <Link href={`/equipe/${player.team.slug}`}>
                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-base px-4 py-1">
                  {player.team.name}
                </Badge>
              </Link>
            )}
          </div>

          <Separator className="bg-slate-200 my-6" />

          {/* Informations detaillees */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {player.position && (
              <div>
                <p className="text-slate-500 text-sm">Poste</p>
                <p className="font-medium text-slate-700">{positionLabels[player.position] || player.position}</p>
              </div>
            )}
            {player.nationality && (
              <div>
                <p className="text-slate-500 text-sm">Nationalite</p>
                <p className="font-medium text-slate-700">{player.nationality}</p>
              </div>
            )}
            {player.birth_date && (
              <div>
                <p className="text-slate-500 text-sm">Date de naissance</p>
                <p className="font-medium text-slate-700">
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
                <p className="text-slate-500 text-sm">Numero</p>
                <p className="font-medium text-emerald-600 text-xl">{player.number}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Statistiques */}
        {player.stats_json && (
          <Card className="bg-slate-50 border-slate-200 p-6 mt-6">
            <h2 className="font-display text-lg font-bold text-emerald-600 mb-4">Statistiques</h2>
            <Separator className="bg-slate-200 mb-4" />
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
                      <p className="text-slate-500 text-sm">
                        {statLabels[key] || key.replace(/_/g, " ")}
                      </p>
                      <p className="text-2xl font-bold text-emerald-600">{value}</p>
                    </div>
                  );
                }
              )}
            </div>
          </Card>
        )}

        {/* Derniers matchs de l'équipe */}
        {recentMatches && recentMatches.length > 0 && (
          <Card className="bg-slate-50 border-slate-200 p-6 mt-6">
            <h2 className="font-display text-lg font-bold text-emerald-600 mb-4">Derniers matchs</h2>
            <div className="space-y-2">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {recentMatches.map((m: any) => (
                <Link key={m.slug} href={`/match/${m.slug}`} className="flex items-center justify-between rounded-lg card-glass px-3 py-2 text-sm hover:bg-slate-100 transition-colors">
                  <span className="text-xs text-slate-400 w-20">
                    {new Date(m.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </span>
                  <span className="flex-1 text-right text-slate-900">{m.home_team?.name}</span>
                  <span className="mx-3 font-bold text-emerald-600">{m.score_home} - {m.score_away}</span>
                  <span className="flex-1 text-slate-900">{m.away_team?.name}</span>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {/* Articles mentionnant le joueur */}
        {relatedArticles && relatedArticles.length > 0 && (
          <div className="mt-8">
            <h2 className="font-display text-xl font-bold text-emerald-600 mb-4">
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
