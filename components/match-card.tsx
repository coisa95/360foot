import Link from "next/link";
import { Badge } from "@/components/ui/badge";

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
    NS: { label: "À venir", className: "bg-blue-500/15 text-blue-400 border border-blue-500/20" },
    "1H": { label: "🔴 1re MT", className: "bg-red-500/15 text-red-400 border border-red-500/20 animate-pulse" },
    HT: { label: "Mi-temps", className: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20" },
    "2H": { label: "🔴 2e MT", className: "bg-red-500/15 text-red-400 border border-red-500/20 animate-pulse" },
    FT: { label: "Terminé", className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" },
    PST: { label: "Reporté", className: "bg-orange-500/15 text-orange-400 border border-orange-500/20" },
    CANC: { label: "Annulé", className: "bg-red-500/15 text-red-400 border border-red-500/20" },
  };
  const { label, className } = config[status] || config.NS;
  return <Badge className={`rounded-lg text-[10px] ${className}`}>{label}</Badge>;
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
    <Link href={`/match/${slug}`} className="group block">
      <div className="rounded-xl border border-dark-border/50 bg-dark-card/80 p-4 shadow-lg shadow-black/10 transition-all duration-300 hover:border-lime-500/20 hover:shadow-xl hover:shadow-lime-500/5 hover:-translate-y-0.5 backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-medium text-gray-400">{leagueName}</span>
          <StatusBadge status={status} />
        </div>

        <div className="flex items-center justify-between">
          {/* Home Team */}
          <div className="flex-1 text-right">
            <span className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">{homeTeam}</span>
          </div>

          {/* Score / Time */}
          <div className="mx-4 min-w-[4.5rem] text-center">
            {status === "NS" ? (
              <div className="rounded-lg bg-blue-500/10 px-3 py-1">
                <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{timeStr}</span>
              </div>
            ) : (
              <div className="rounded-lg bg-dark-surface px-3 py-1">
                <span className="text-lg font-bold text-white">
                  {homeScore ?? 0} <span className="text-gray-500">-</span> {awayScore ?? 0}
                </span>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 text-left">
            <span className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">{awayTeam}</span>
          </div>
        </div>

        <div className="mt-3 text-center text-[11px] text-gray-500">
          {matchDate.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
      </div>
    </Link>
  );
}
