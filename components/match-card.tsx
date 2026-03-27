import Link from "next/link";

interface MatchCardProps {
  slug: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number | null;
  awayScore?: number | null;
  status: string;
  date: string;
  leagueName: string;
  homeTeamSlug?: string;
  awayTeamSlug?: string;
  leagueSlug?: string;
  homeLogoUrl?: string | null;
  awayLogoUrl?: string | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  NS: { label: "À venir", color: "text-blue-400" },
  "1H": { label: "🔴 1MT", color: "text-red-400" },
  HT: { label: "MT", color: "text-yellow-400" },
  "2H": { label: "🔴 2MT", color: "text-red-400" },
  FT: { label: "Terminé", color: "text-emerald-400" },
  AET: { label: "AP", color: "text-emerald-400" },
  PEN: { label: "TAB", color: "text-emerald-400" },
  PST: { label: "Reporté", color: "text-orange-400" },
  CANC: { label: "Annulé", color: "text-red-400" },
};

export function MatchCard({
  slug,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  status,
  date,
  leagueName,
  homeTeamSlug,
  awayTeamSlug,
  leagueSlug,
}: MatchCardProps) {
  const matchDate = new Date(date);
  const timeStr = matchDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const dateStr = matchDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  const statusConf = STATUS_LABELS[status] || STATUS_LABELS.NS;
  const isLive = status === "1H" || status === "2H";

  return (
    <Link href={`/match/${slug}`} className="group block">
      <div className={`flex items-center gap-2 rounded-lg border bg-dark-card/80 px-3 py-2.5 transition-colors hover:border-lime-500/20 ${isLive ? "border-red-500/30" : "border-dark-border/50"}`}>
        {/* Date / Time */}
        <div className="w-12 shrink-0 text-center">
          {status === "NS" ? (
            <>
              <p className="text-xs font-bold text-blue-400">{timeStr}</p>
              <p className="text-[9px] text-gray-500">{dateStr}</p>
            </>
          ) : (
            <>
              <p className={`text-[10px] font-semibold ${statusConf.color}`}>{statusConf.label}</p>
              <p className="text-[9px] text-gray-500">{dateStr}</p>
            </>
          )}
        </div>

        {/* Teams + Score */}
        <div className="flex-1 min-w-0">
          {/* Home */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-gray-200 truncate group-hover:text-white">{homeTeam}</span>
            {status !== "NS" && (
              <span className={`text-xs font-bold tabular-nums ${(homeScore ?? 0) > (awayScore ?? 0) ? "text-white" : "text-gray-400"}`}>
                {homeScore ?? 0}
              </span>
            )}
          </div>
          {/* Away */}
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <span className="text-xs font-medium text-gray-200 truncate group-hover:text-white">{awayTeam}</span>
            {status !== "NS" && (
              <span className={`text-xs font-bold tabular-nums ${(awayScore ?? 0) > (homeScore ?? 0) ? "text-white" : "text-gray-400"}`}>
                {awayScore ?? 0}
              </span>
            )}
          </div>
        </div>

        {/* League badge (if provided) */}
        {leagueName && (
          <div className="hidden sm:block shrink-0">
            {leagueSlug ? (
              <span className="text-[9px] text-gray-500">{leagueName}</span>
            ) : (
              <span className="text-[9px] text-gray-500">{leagueName}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
