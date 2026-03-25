import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface MatchCardProps {
  slug: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number | null;
  awayScore?: number | null;
  status: string;
  date: string;
  leagueName: string;
  homeLogoUrl?: string | null;
  awayLogoUrl?: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    NS: { label: "À venir", className: "bg-dark-surface text-gray-400" },
    "1H": { label: "1re MT", className: "bg-red-500/20 text-red-400 animate-pulse" },
    HT: { label: "Mi-temps", className: "bg-yellow-500/20 text-yellow-400" },
    "2H": { label: "2e MT", className: "bg-red-500/20 text-red-400 animate-pulse" },
    FT: { label: "Terminé", className: "bg-dark-surface text-gray-400" },
    PST: { label: "Reporté", className: "bg-orange-500/20 text-orange-400" },
    CANC: { label: "Annulé", className: "bg-red-500/20 text-red-400" },
  };
  const { label, className } = config[status] || config.NS;
  return <Badge className={className}>{label}</Badge>;
}

export function MatchCard({
  slug,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  status,
  date,
  leagueName,
}: MatchCardProps) {
  const matchDate = new Date(date);
  const timeStr = matchDate.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link href={`/match/${slug}`}>
      <Card className="border-dark-border bg-dark-card p-4 transition-colors hover:border-lime-500/30 hover:bg-dark-surface">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-gray-500">{leagueName}</span>
          <StatusBadge status={status} />
        </div>

        <div className="flex items-center justify-between">
          {/* Home Team */}
          <div className="flex-1 text-right">
            <span className="text-sm font-medium text-white">{homeTeam}</span>
          </div>

          {/* Score / Time */}
          <div className="mx-4 min-w-[4rem] text-center">
            {status === "NS" ? (
              <span className="text-lg font-bold text-lime-400">{timeStr}</span>
            ) : (
              <span className="text-lg font-bold text-white">
                {homeScore ?? 0} - {awayScore ?? 0}
              </span>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 text-left">
            <span className="text-sm font-medium text-white">{awayTeam}</span>
          </div>
        </div>

        <div className="mt-2 text-center text-xs text-gray-500">
          {matchDate.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
      </Card>
    </Link>
  );
}
