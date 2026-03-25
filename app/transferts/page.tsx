import { createClient } from "@/lib/supabase";
import { Breadcrumb } from "@/components/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AffiliateBanner } from "@/components/affiliate-banner";
import { Metadata } from "next";
import Link from "next/link";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Transferts - Dernieres infos mercato football africain - 360 Foot",
  description:
    "Suivez tous les transferts du football africain : arrivees, departs, prets et montants des transferts des joueurs africains.",
  openGraph: {
    title: "Transferts - Dernieres infos mercato football africain - 360 Foot",
    description:
      "Suivez tous les transferts du football africain : arrivees, departs, prets et montants des transferts des joueurs africains.",
    type: "website",
    url: "https://360-foot.com/transferts",
  },
};

export default async function TransfersPage() {
  const supabase = createClient();

  const { data: transfers } = await supabase
    .from("transfers")
    .select(
      "*, player:players!player_id(*), from_team:teams!from_team_id(*), to_team:teams!to_team_id(*)"
    )
    .order("date", { ascending: false })
    .limit(50);

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Transferts" },
  ];

  const typeLabels: Record<string, string> = {
    transfer: "Transfert",
    loan: "Pret",
    loan_return: "Retour de pret",
    free: "Libre",
    retirement: "Retraite",
  };

  const typeBadgeColor: Record<string, string> = {
    transfer: "bg-lime-500/20 text-lime-400 border-lime-500/30",
    loan: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    loan_return: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    free: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    retirement: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <main className="min-h-screen bg-dark-bg text-white">
      <div className="container mx-auto px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-lime-400">Transferts</h1>
          <p className="text-gray-400 mt-1">
            Derniers mouvements de joueurs dans le football africain
          </p>
        </div>

        <AffiliateBanner bookmakerName="1xBet" affiliateUrl="https://1xbet.com/?ref=360foot" bonus="Bonus 100% jusqu'à 130€" />

        {/* Liste des transferts */}
        <div className="mt-8 space-y-4">
          {transfers && transfers.length > 0 ? (
            transfers.map((transfer) => (
              <Card
                key={transfer.id}
                className="bg-dark-bg border-gray-800 p-4 hover:border-gray-700 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {transfer.player ? (
                        <Link
                          href={`/joueur/${transfer.player.slug}`}
                          className="text-lg font-bold hover:text-lime-400 transition-colors"
                        >
                          {transfer.player.name}
                        </Link>
                      ) : (
                        <span className="text-lg font-bold">
                          {transfer.player_name || "Joueur inconnu"}
                        </span>
                      )}
                      {transfer.type && (
                        <Badge
                          className={
                            typeBadgeColor[transfer.type] || typeBadgeColor.transfer
                          }
                        >
                          {typeLabels[transfer.type] || transfer.type}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      {transfer.from_team ? (
                        <Link
                          href={`/equipe/${transfer.from_team.slug}`}
                          className="hover:text-white transition-colors"
                        >
                          {transfer.from_team.name}
                        </Link>
                      ) : (
                        <span>-</span>
                      )}
                      <span className="text-lime-400">→</span>
                      {transfer.to_team ? (
                        <Link
                          href={`/equipe/${transfer.to_team.slug}`}
                          className="hover:text-white transition-colors"
                        >
                          {transfer.to_team.name}
                        </Link>
                      ) : (
                        <span>-</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {transfer.fee && (
                      <span className="text-lime-400 font-bold">
                        {transfer.fee}
                      </span>
                    )}
                    {transfer.date && (
                      <span className="text-gray-500 text-sm">
                        {new Date(transfer.date).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="bg-dark-bg border-gray-800 p-8 text-center">
              <p className="text-gray-400">Aucun transfert disponible pour le moment.</p>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
