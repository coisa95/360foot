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
    "Tous les transferts football : arrivées, départs, prêts et montants. Mercato Afrique et Europe en direct.",
  alternates: {
    canonical: "https://360-foot.com/transferts",
  },
  openGraph: {
    title: "Transferts — Mercato football africain et européen",
    description:
      "Suivez tous les transferts du football africain et européen : arrivées, départs, prêts et montants.",
    type: "website",
    url: "https://360-foot.com/transferts",
    locale: "fr_FR",
    images: ["https://360-foot.com/api/og?title=Transferts%20-%20Mercato%20football"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Transferts — Mercato football africain et européen",
    description:
      "Suivez tous les transferts du football africain et européen.",
    images: ["https://360-foot.com/api/og?title=Transferts%20-%20Mercato%20football"],
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
  "N/A": "bg-emerald-50 text-emerald-600 border-emerald-200",
  Free: "bg-slate-100 text-slate-500 border-slate-300",
  Loan: "bg-blue-50 text-blue-600 border-blue-200",
  transfer: "bg-emerald-50 text-emerald-600 border-emerald-200",
  loan: "bg-blue-50 text-blue-600 border-blue-200",
  free: "bg-slate-100 text-slate-500 border-slate-300",
};

export default async function TransfersPage() {
  const supabase = createClient();

  // Phase 1: fetch transfers + articles in parallel
  const [{ data: transfers }, { data: transferArticles }] = await Promise.all([
    supabase
      .from("transfers")
      .select("id,player_name,player_photo,player_nationality,from_team,from_team_logo,to_team,to_team_logo,transfer_type,fee,market_value,date")
      .order("date", { ascending: false })
      .limit(60),
    supabase
      .from("articles")
      .select("id, title, slug, excerpt, created_at")
      .eq("type", "transfer")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  // Phase 2: lookup player + team slugs in parallel
  const playerNames = transfers?.map((t) => t.player_name).filter(Boolean) || [];
  const teamNames = new Set<string>();
  transfers?.forEach((t) => {
    if (t.from_team) teamNames.add(t.from_team);
    if (t.to_team) teamNames.add(t.to_team);
  });

  const [{ data: matchedPlayers }, { data: matchedTeams }] = await Promise.all([
    playerNames.length > 0
      ? supabase.from("players").select("name, slug").in("name", playerNames)
      : Promise.resolve({ data: null }),
    teamNames.size > 0
      ? supabase.from("teams").select("name, slug").in("name", Array.from(teamNames))
      : Promise.resolve({ data: null }),
  ]);

  const playerSlugMap: Record<string, string> = {};
  if (matchedPlayers) {
    for (const p of matchedPlayers) playerSlugMap[p.name] = p.slug;
  }
  const teamSlugMap: Record<string, string> = {};
  if (matchedTeams) {
    for (const t of matchedTeams) teamSlugMap[t.name] = t.slug;
  }

  return (
    <main className="min-h-screen bg-transparent text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Transferts" }]} />

        <div className="mt-6 mb-6">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900">
            Transferts{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-400 bg-clip-text text-transparent">
              Mercato
            </span>
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Derniers mouvements de joueurs — football africain et européen
          </p>
        </div>

        {/* Articles transferts */}
        {transferArticles && transferArticles.length > 0 && (
          <section className="mb-6">
            <h2 className="font-display section-title mb-3">Analyses transferts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {transferArticles.map((article) => (
                <Link key={article.id} href={`/actu/${article.slug}`} className="group block">
                  <Card className="h-full border-slate-200 bg-white p-4 transition-all hover:border-emerald-200 hover:-translate-y-0.5">
                    <h3 className="font-display font-semibold text-sm text-slate-800 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-slate-400 text-xs mt-2 line-clamp-2">{article.excerpt}</p>
                    )}
                    <time className="block text-[11px] text-slate-400 mt-2">
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
          <h2 className="font-display section-title mb-4">Tableau des transferts</h2>

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
                    className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 transition-colors hover:border-emerald-500/15"
                  >
                    {/* Player photo */}
                    {hasPhoto ? (
                      <Image
                        src={t.player_photo}
                        alt={t.player_name}
                        width={40}
                        height={40}
                        className="h-10 w-10 shrink-0 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 border border-slate-200">
                        <span className="text-xs text-slate-400">
                          {t.player_name?.charAt(0) || "?"}
                        </span>
                      </div>
                    )}

                    {/* Player info + clubs */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {playerSlugMap[t.player_name] ? (
                          <Link href={`/joueur/${playerSlugMap[t.player_name]}`} className="text-sm font-bold text-slate-900 truncate hover:text-emerald-600 transition-colors">
                            {t.player_name}
                          </Link>
                        ) : (
                          <span className="text-sm font-bold text-slate-900 truncate">
                            {t.player_name}
                          </span>
                        )}
                        <Badge className={`text-[10px] px-1.5 py-0 ${badge}`}>
                          {label}
                        </Badge>
                        {hasNat && (
                          <span className="text-[10px] text-slate-400">{t.player_nationality}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs">
                        {t.from_team_logo && (
                          <Image src={t.from_team_logo} alt={`Logo ${t.from_team}`} width={16} height={16} className="h-4 w-4 rounded-sm object-contain" />
                        )}
                        {teamSlugMap[t.from_team] ? (
                          <Link href={`/equipe/${teamSlugMap[t.from_team]}`} className="text-slate-500 truncate hover:text-emerald-600 transition-colors">{t.from_team}</Link>
                        ) : (
                          <span className="text-slate-500 truncate">{t.from_team || "?"}</span>
                        )}
                        <span className="text-emerald-600 font-bold shrink-0">→</span>
                        {t.to_team_logo && (
                          <Image src={t.to_team_logo} alt={`Logo ${t.to_team}`} width={16} height={16} className="h-4 w-4 rounded-sm object-contain" />
                        )}
                        {teamSlugMap[t.to_team] ? (
                          <Link href={`/equipe/${teamSlugMap[t.to_team]}`} className="text-slate-900 truncate hover:text-emerald-600 transition-colors">{t.to_team}</Link>
                        ) : (
                          <span className="text-slate-900 truncate">{t.to_team || "?"}</span>
                        )}
                      </div>
                    </div>

                    {/* Fee + Date */}
                    <div className="shrink-0 text-right">
                      {hasFee && (
                        <p className="text-sm font-bold text-emerald-600">{t.fee}</p>
                      )}
                      {t.market_value && !hasFee && (
                        <p className="text-xs text-slate-400">Valeur: {t.market_value}</p>
                      )}
                      {t.date && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
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
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-sm text-slate-400">Aucun transfert disponible pour le moment.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
