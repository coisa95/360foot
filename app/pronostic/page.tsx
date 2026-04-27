import { createAnonClient } from "@/lib/supabase";
import { Breadcrumb } from "@/components/breadcrumb";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 600;

const TITLE = "Pronostics football — Prédictions et analyses";
const DESCRIPTION =
  "Tous nos pronostics football : Ligue 1 Côte d'Ivoire, Premier League, Champions League, CAN. Analyses, cotes et prédictions pour les matchs à venir.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://360-foot.com/pronostic" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "https://360-foot.com/pronostic",
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

type TeamRef = { name: string; logo_url: string | null };
type LeagueRef = { name: string; slug: string };
type PronosticMatch = {
  slug: string;
  date: string;
  home_team: TeamRef | null;
  away_team: TeamRef | null;
  league: LeagueRef | null;
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function bucketLabel(matchDate: Date, today: Date): string {
  const day = startOfDay(matchDate).getTime();
  const todayStart = startOfDay(today).getTime();
  const diffDays = Math.round((day - todayStart) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Aujourd'hui";
  if (diffDays === 1) return "Demain";
  if (diffDays <= 7) return "Cette semaine";
  return "Plus tard";
}

export default async function PronosticIndexPage() {
  const supabase = createAnonClient();
  const now = new Date();
  const nowIso = now.toISOString();

  const { data } = await supabase
    .from("matches")
    .select(
      "slug,date,home_team:teams!home_team_id(name,logo_url),away_team:teams!away_team_id(name,logo_url),league:leagues!league_id(name,slug)"
    )
    .gte("date", nowIso)
    .not("predictions_json", "is", null)
    .eq("status", "NS")
    .order("date", { ascending: true })
    .limit(50);

  const matches = (data ?? []) as unknown as PronosticMatch[];

  const order = ["Aujourd'hui", "Demain", "Cette semaine", "Plus tard"];
  const groups = new Map<string, PronosticMatch[]>();
  for (const m of matches) {
    const label = bucketLabel(new Date(m.date), now);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(m);
  }

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Pronostics" },
  ];

  return (
    <main className="min-h-screen text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        <h1 className="font-display mt-6 text-3xl font-bold md:text-4xl">
          <span className="text-emerald-600">Pronostics football</span> : prédictions et analyses du jour
        </h1>
        <p className="mt-2 text-slate-500 text-sm max-w-2xl">
          Prédictions et analyses pour les prochains matchs : Ligue 1 Côte
          d&apos;Ivoire, Premier League, Champions League, CAN et plus encore.
        </p>

        {matches.length === 0 ? (
          <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-400">
              Aucun pronostic disponible pour le moment. Revenez bientôt.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {order
              .filter((label) => groups.has(label))
              .map((label) => (
                <section key={label}>
                  <h2 className="font-display text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <span className="w-1 h-5 bg-emerald-500 rounded-full" />
                    {label}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {groups.get(label)!.map((m) => {
                      const homeName = m.home_team?.name || "Équipe A";
                      const awayName = m.away_team?.name || "Équipe B";
                      const d = new Date(m.date);
                      const dateStr = d.toLocaleDateString("fr-FR", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      });
                      const timeStr = d.toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      return (
                        <Link
                          key={m.slug}
                          href={`/pronostic/${m.slug}`}
                          className="block"
                        >
                          <Card className="border-slate-200 bg-white p-4 hover:border-emerald-200 transition-colors h-full flex flex-col">
                            {m.league?.name && (
                              <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 self-start mb-2">
                                {m.league.name}
                              </Badge>
                            )}
                            <div className="flex items-center justify-between gap-2 flex-1">
                              <div className="flex-1 min-w-0 text-center">
                                {m.home_team?.logo_url ? (
                                  <Image
                                    src={m.home_team.logo_url}
                                    alt={`Logo ${homeName}`}
                                    width={40}
                                    height={40}
                                    className="mx-auto h-10 w-10 object-contain"
                                  />
                                ) : (
                                  <div className="mx-auto h-10 w-10 rounded bg-slate-100" />
                                )}
                                <p className="mt-2 text-xs font-medium text-slate-900 truncate">
                                  {homeName}
                                </p>
                              </div>
                              <div className="shrink-0 text-center">
                                <p className="text-xs text-slate-400">vs</p>
                                <p className="mt-1 text-[11px] font-medium text-slate-500">
                                  {timeStr}
                                </p>
                              </div>
                              <div className="flex-1 min-w-0 text-center">
                                {m.away_team?.logo_url ? (
                                  <Image
                                    src={m.away_team.logo_url}
                                    alt={`Logo ${awayName}`}
                                    width={40}
                                    height={40}
                                    className="mx-auto h-10 w-10 object-contain"
                                  />
                                ) : (
                                  <div className="mx-auto h-10 w-10 rounded bg-slate-100" />
                                )}
                                <p className="mt-2 text-xs font-medium text-slate-900 truncate">
                                  {awayName}
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                              <span className="text-[11px] text-slate-400">
                                {dateStr}
                              </span>
                              <span className="text-xs font-semibold text-emerald-600">
                                Voir le pronostic →
                              </span>
                            </div>
                          </Card>
                        </Link>
                      );
                    })}
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
