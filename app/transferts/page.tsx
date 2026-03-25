import { createClient } from "@/lib/supabase";
import { Breadcrumb } from "@/components/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AffiliateBanner } from "@/components/affiliate-banner";
import { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Transferts - Dernières infos mercato football africain - 360 Foot",
  description:
    "Suivez tous les transferts du football africain : arrivées, départs, prêts et montants des transferts des joueurs africains.",
  openGraph: {
    title: "Transferts - Dernières infos mercato football africain - 360 Foot",
    description:
      "Suivez tous les transferts du football africain : arrivées, départs, prêts et montants des transferts des joueurs africains.",
    type: "website",
    url: "https://360-foot.com/transferts",
  },
};

export default async function TransfersPage() {
  const supabase = createClient();

  // Get transfers (simple columns, no joins)
  const { data: transfers } = await supabase
    .from("transfers")
    .select("*")
    .order("date", { ascending: false })
    .limit(50);

  // Also get transfer articles
  const { data: transferArticles } = await supabase
    .from("articles")
    .select("id, title, slug, excerpt, created_at")
    .eq("type", "transfer")
    .order("created_at", { ascending: false })
    .limit(10);

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Transferts" },
  ];

  const typeLabels: Record<string, string> = {
    "N/A": "Transfert",
    Free: "Libre",
    Loan: "Prêt",
    transfer: "Transfert",
    loan: "Prêt",
    free: "Libre",
  };

  const typeBadgeColor: Record<string, string> = {
    "N/A": "bg-lime-500/20 text-lime-400 border-lime-500/30",
    Free: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    Loan: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    transfer: "bg-lime-500/20 text-lime-400 border-lime-500/30",
    loan: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    free: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };

  return (
    <main className="min-h-screen bg-dark-bg text-white">
      <div className="container mx-auto px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-lime-400">Transferts</h1>
          <p className="text-gray-400 mt-1">
            Derniers mouvements de joueurs dans le football africain et européen
          </p>
        </div>

        <AffiliateBanner
          bookmakerName="1xBet"
          affiliateUrl="https://reffpa.com/L?tag=d_689933m_1573c_bonus&site=689933&ad=1573"
          bonus="Bonus de bienvenue jusqu'à 200 000 FCFA"
        />

        {/* Articles transferts */}
        {transferArticles && transferArticles.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-white mb-4">
              Analyses transferts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {transferArticles.map((article) => (
                <a
                  key={article.id}
                  href={`/actu/${article.slug}`}
                  className="block"
                >
                  <Card className="bg-dark-card border-gray-800 p-4 hover:border-lime-500/30 transition-colors h-full">
                    <h3 className="font-bold text-white hover:text-lime-400 transition-colors">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                        {article.excerpt}
                      </p>
                    )}
                    <p className="text-gray-600 text-xs mt-2">
                      {new Date(article.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Liste des transferts */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-white mb-4">
            Tableau des transferts
          </h2>
          <div className="space-y-3">
            {transfers && transfers.length > 0 ? (
              transfers.map((transfer) => (
                <Card
                  key={transfer.id}
                  className="bg-dark-card border-gray-800 p-4 hover:border-gray-700 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-lg font-bold text-white">
                          {transfer.player_name}
                        </span>
                        {transfer.transfer_type && (
                          <Badge
                            className={
                              typeBadgeColor[transfer.transfer_type] ||
                              "bg-lime-500/20 text-lime-400 border-lime-500/30"
                            }
                          >
                            {typeLabels[transfer.transfer_type] ||
                              transfer.transfer_type}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>{transfer.from_team || "?"}</span>
                        <span className="text-lime-400 font-bold">→</span>
                        <span className="text-white">
                          {transfer.to_team || "?"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {transfer.fee && transfer.fee !== "Non communiqué" && (
                        <span className="text-lime-400 font-bold text-sm">
                          {transfer.fee}
                        </span>
                      )}
                      {transfer.date && (
                        <span className="text-gray-500 text-sm whitespace-nowrap">
                          {new Date(transfer.date).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="bg-dark-card border-gray-800 p-8 text-center">
                <p className="text-gray-400">
                  Les transferts sont mis à jour automatiquement. Revenez bientôt !
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
