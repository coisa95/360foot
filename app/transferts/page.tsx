import { createClient } from "@/lib/supabase";
import { Breadcrumb } from "@/components/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Transferts — Mercato football africain et européen",
  description:
    "Suivez tous les transferts du football africain et européen : arrivées, départs, prêts et montants.",
  alternates: {
    canonical: "https://360-foot.com/transferts",
  },
  openGraph: {
    title: "Transferts — Mercato football africain et européen",
    description:
      "Suivez tous les transferts du football africain et européen : arrivées, départs, prêts et montants.",
    type: "website",
    url: "https://360-foot.com/transferts",
    images: ["/api/og?title=Transferts%20-%20Mercato%20football"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Transferts — Mercato football africain et européen",
    description:
      "Suivez tous les transferts du football africain et européen.",
  },
};

const TYPE_LABELS: Record<string, string> = {
  "N/A": "Transfert",
  Free: "Libre",
  Loan: "Prêt",
  transfer: "Transfert",
  loan: "Prêt",
  free: "Libre",
};

const TYPE_BADGE: Record<string, string> = {
  "N/A": "bg-lime-500/15 text-lime-400 border-lime-500/20",
  Free: "bg-gray-500/15 text-gray-400 border-gray-500/20",
  Loan: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  transfer: "bg-lime-500/15 text-lime-400 border-lime-500/20",
  loan: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  free: "bg-gray-500/15 text-gray-400 border-gray-500/20",
};

export default async function TransfersPage() {
  const supabase = createClient();

  const { data: transfers } = await supabase
    .from("transfers")
    .select("*")
    .order("date", { ascending: false })
    .limit(60);

  const { data: transferArticles } = await supabase
    .from("articles")
    .select("id, title, slug, excerpt, created_at")
    .eq("type", "transfer")
    .order("created_at", { ascending: false })
    .limit(6);

  // Lookup player slugs for linking
  const playerNames = transfers?.map((t) => t.player_name).filter(Boolean) || [];
  const playerSlugMap: Record<string, string> = {};
  if (playerNames.length > 0) {
    const { data: matchedPlayers } = await supabase
      .from("players")
      .select("name, slug")
      .in("name", playerNames);
    if (matchedPlayers) {
      for (const p of matchedPlayers) playerSlugMap[p.name] = p.slug;
    }
  }

  // Lookup team slugs for linking
  const teamNames = new Set<string>();
  transfers?.forEach((t) => {
    if (t.from_team) teamNames.add(t.from_team);
    if (t.to_team) teamNames.add(t.to_team);
  });
  const teamSlugMap: Record<string, string> = {};
  if (teamNames.size > 0) {
    const { data: matchedTeams } = await supabase
      .from("teams")
      .select("name, slug")
      .in("name", Array.from(teamNames));
    if (matchedTeams) {
      for (const t of matchedTeams) teamSlugMap[t.name] = t.slug;
    }
  }

  return (
    <main className="min-h-screen bg-dark-bg text-white">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Transferts" }]} />

        <div className="mt-6 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Transferts{" "}
            <span className="bg-gradient-to-r from-lime-400 to-emerald-400 bg-clip-text text-transparent">
              Mercato
            </span>
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Derniers mouvements de joueurs — football africain et européen
          </p>
        </div>

        {/* Articles transferts */}
        {transferArticles && transferArticles.length > 0 && (
          <section className="mb-6">
            <h2 className="section-title mb-3">Analyses transferts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {transferArticles.map((article) => (
                <Link key={article.id} href={`/actu/${article.slug}`} className="group block">
                  <Card className="h-full border-dark-border/50 bg-dark-card/80 p-4 transition-all hover:border-lime-500/20 hover:-translate-y-0.5">
                    <h3 className="font-semibold text-sm text-gray-100 line-clamp-2 group-hover:text-lime-400 transition-colors">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-gray-500 text-xs mt-2 line-clamp-2">{article.excerpt}</p>
                    )}
                    <time className="block text-[11px] text-gray-600 mt-2">
                      {new Date(article.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                      })}
                    </time>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        <AffiliateTrio />

        {/* Tableau des transferts */}
        <section className="mt-6">
          <h2 className="section-title mb-4">Tableau des transferts</h2>

          {transfers && transfers.length > 0 ? (
            <div className="space-y-2">
              {transfers.map((t) => {
                const badge = TYPE_BADGE[t.transfer_type] || TYPE_BADGE["N/A"];
                const label = TYPE_LABELS[t.transfer_type] || t.transfer_type || "Transfert";
                const hasFee = t.fee && t.fee !== "Non communiqué" && t.fee !== "-";
                const hasPhoto = t.player_photo;
                const hasNat = t.player_nationality;

                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 rounded-lg border border-dark-border/50 bg-dark-card/80 px-3 py-3 transition-colors hover:border-lime-500/15"
                  >
                    {/* Player photo */}
                    {hasPhoto ? (
                      <Image
                        src={t.player_photo}
                        alt={t.player_name}
                        width={40}
                        height={40}
                        className="h-10 w-10 shrink-0 rounded-full object-cover border border-dark-border"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-dark-surface border border-dark-border">
                        <span className="text-xs text-gray-500">
                          {t.player_name?.charAt(0) || "?"}
                        </span>
                      </div>
                    )}

                    {/* Player info + clubs */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {playerSlugMap[t.player_name] ? (
                          <Link href={`/joueur/${playerSlugMap[t.player_name]}`} className="text-sm font-bold text-white truncate hover:text-lime-400 transition-colors">
                            {t.player_name}
                          </Link>
                        ) : (
                          <span className="text-sm font-bold text-white truncate">
                            {t.player_name}
                          </span>
                        )}
                        <Badge className={`text-[10px] px-1.5 py-0 ${badge}`}>
                          {label}
                        </Badge>
                        {hasNat && (
                          <span className="text-[10px] text-gray-500">{t.player_nationality}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs">
                        {t.from_team_logo && (
                          <Image src={t.from_team_logo} alt={`Logo ${t.from_team}`} width={16} height={16} className="h-4 w-4 rounded-sm object-contain" unoptimized />
                        )}
                        {teamSlugMap[t.from_team] ? (
                          <Link href={`/equipe/${teamSlugMap[t.from_team]}`} className="text-gray-400 truncate hover:text-lime-400 transition-colors">{t.from_team}</Link>
                        ) : (
                          <span className="text-gray-400 truncate">{t.from_team || "?"}</span>
                        )}
                        <span className="text-lime-400 font-bold shrink-0">→</span>
                        {t.to_team_logo && (
                          <Image src={t.to_team_logo} alt={`Logo ${t.to_team}`} width={16} height={16} className="h-4 w-4 rounded-sm object-contain" unoptimized />
                        )}
                        {teamSlugMap[t.to_team] ? (
                          <Link href={`/equipe/${teamSlugMap[t.to_team]}`} className="text-white truncate hover:text-lime-400 transition-colors">{t.to_team}</Link>
                        ) : (
                          <span className="text-white truncate">{t.to_team || "?"}</span>
                        )}
                      </div>
                    </div>

                    {/* Fee + Date */}
                    <div className="shrink-0 text-right">
                      {hasFee && (
                        <p className="text-sm font-bold text-lime-400">{t.fee}</p>
                      )}
                      {t.market_value && !hasFee && (
                        <p className="text-xs text-gray-500">Valeur: {t.market_value}</p>
                      )}
                      {t.date && (
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {new Date(t.date).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dark-border/50 bg-dark-card/50 p-8 text-center">
              <p className="text-sm text-gray-500">Aucun transfert disponible pour le moment.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
