import { createAnonClient } from "@/lib/supabase";
import { Breadcrumb } from "@/components/breadcrumb";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { Card } from "@/components/ui/card";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 3600;

const TITLE = "Joueurs de football — Profils et statistiques";
const DESCRIPTION =
  "Profils de joueurs de football africains et européens : statistiques, transferts, actualités. Osimhen, Mané, Mbappé et bien d'autres.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://360-foot.com/joueur" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "https://360-foot.com/joueur",
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

type PlayerRow = {
  slug: string;
  name: string;
  photo_url: string | null;
  nationality: string | null;
  position: string | null;
  team: {
    name: string;
    slug: string;
    logo_url: string | null;
  } | null;
};

const POSITION_LABELS: Record<string, string> = {
  goalkeeper: "Gardien",
  defender: "Défenseur",
  midfielder: "Milieu",
  forward: "Attaquant",
  Goalkeeper: "Gardien",
  Defender: "Défenseur",
  Midfielder: "Milieu",
  Attacker: "Attaquant",
  GK: "Gardien",
  DEF: "Défenseur",
  MID: "Milieu",
  FWD: "Attaquant",
};

export default async function JoueurIndexPage() {
  const supabase = createAnonClient();

  // Note: the schema uses `team_id` (not `current_team_id`) — verified against
  // app/joueur/[slug]/page.tsx and app/equipe/[slug]/page.tsx.
  const { data } = await supabase
    .from("players")
    .select(
      "slug,name,photo_url,nationality,position,team:teams!team_id(name,slug,logo_url)"
    )
    .not("slug", "is", null)
    .order("name", { ascending: true })
    .limit(200);

  const players = (data ?? []) as unknown as PlayerRow[];

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Joueurs" },
  ];

  return (
    <main className="min-h-screen text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        <h1 className="font-display mt-6 text-3xl font-bold md:text-4xl">
          <span className="text-emerald-600">Joueurs de football</span> : profils, stats et actualités
        </h1>
        <p className="mt-2 text-slate-500 text-sm max-w-2xl">
          Profils, statistiques, transferts et actualités des joueurs africains
          et européens.
        </p>

        {players.length === 0 ? (
          <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-400">Aucun joueur à afficher.</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {players.map((p) => {
              const positionLabel = p.position
                ? POSITION_LABELS[p.position] || p.position
                : null;
              return (
                <Link key={p.slug} href={`/joueur/${p.slug}`}>
                  <Card className="border-slate-200 bg-white p-4 hover:border-emerald-200 transition-colors h-full">
                    <div className="flex items-center gap-3">
                      {p.photo_url ? (
                        <Image
                          src={p.photo_url}
                          alt={`Photo ${p.name}`}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-sm text-slate-400 shrink-0">
                          {p.name?.charAt(0) ?? "?"}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 text-sm truncate">
                          {p.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          {p.nationality && (
                            <span className="truncate">{p.nationality}</span>
                          )}
                          {p.nationality && positionLabel && (
                            <span aria-hidden="true">·</span>
                          )}
                          {positionLabel && (
                            <span className="truncate">{positionLabel}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {p.team?.name && (
                      <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2">
                        {p.team.logo_url ? (
                          <Image
                            src={p.team.logo_url}
                            alt={`Logo ${p.team.name}`}
                            width={20}
                            height={20}
                            className="h-5 w-5 object-contain shrink-0"
                          />
                        ) : (
                          <div className="h-5 w-5 rounded bg-slate-100 shrink-0" />
                        )}
                        <span className="text-xs text-slate-500 truncate">
                          {p.team.name}
                        </span>
                      </div>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-12">
          <AffiliateTrio />
        </div>
      </div>
    </main>
  );
}
