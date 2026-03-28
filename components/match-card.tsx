import Link from "next/link";
import Image from "next/image";

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

const STATUS_LABELS: Record<string, { label: string; full: string; color: string }> = {
  NS: { label: "À venir", full: "À venir", color: "text-blue-400" },
  "1H": { label: "1MT", full: "1ère mi-temps", color: "text-red-400" },
  HT: { label: "MT", full: "Mi-temps", color: "text-yellow-400" },
  "2H": { label: "2MT", full: "2ème mi-temps", color: "text-red-400" },
  FT: { label: "Terminé", full: "Terminé", color: "text-emerald-400" },
  AET: { label: "AP", full: "Après prolongations", color: "text-emerald-400" },
  PEN: { label: "TAB", full: "Tirs au but", color: "text-emerald-400" },
  PST: { label: "Reporté", full: "Reporté", color: "text-orange-400" },
  CANC: { label: "Annulé", full: "Annulé", color: "text-red-400" },
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
  homeLogoUrl,
  awayLogoUrl,
}: MatchCardProps) {
  const matchDate = new Date(date);
  const timeStr = matchDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const dateStr = matchDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  const statusConf = STATUS_LABELS[status] || STATUS_LABELS.NS;
  const isLive = status === "1H" || status === "2H";

  return (
    <Link href={`/match/${slug}`} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-bg rounded-lg">
      <div className={`flex items-center gap-2.5 rounded-lg border bg-dark-card/80 px-3 py-2.5 transition-colors hover:border-lime-500/20 ${isLive ? "border-red-500/30" : "border-dark-border/50"}`}>
        {/* Date / Status */}
        <div className="w-12 shrink-0 text-center">
          {status === "NS" ? (
            <>
              <p className="text-xs font-bold text-blue-400">{timeStr}</p>
              <p className="text-[10px] text-gray-500">{dateStr}</p>
            </>
          ) : (
            <span className={`text-[10px] sm:text-xs font-semibold ${statusConf.color}`} title={statusConf.full}>
              {statusConf.label}
            </span>
          )}
        </div>

        {/* Teams + Score */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {homeLogoUrl && (
                <Image src={homeLogoUrl} alt={`Logo ${homeTeam}`} width={18} height={18} className="w-4 h-4 sm:w-[18px] sm:h-[18px] object-contain shrink-0" unoptimized />
              )}
              <span className="text-xs sm:text-sm font-medium text-gray-200 truncate group-hover:text-white">{homeTeam}</span>
            </div>
            {status !== "NS" && (
              <span className={`text-xs sm:text-sm font-bold tabular-nums shrink-0 ${(homeScore ?? 0) > (awayScore ?? 0) ? "text-white" : "text-gray-400"}`}>
                {homeScore ?? 0}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              {awayLogoUrl && (
                <Image src={awayLogoUrl} alt={`Logo ${awayTeam}`} width={18} height={18} className="w-4 h-4 sm:w-[18px] sm:h-[18px] object-contain shrink-0" unoptimized />
              )}
              <span className="text-xs sm:text-sm font-medium text-gray-200 truncate group-hover:text-white">{awayTeam}</span>
            </div>
            {status !== "NS" && (
              <span className={`text-xs sm:text-sm font-bold tabular-nums shrink-0 ${(awayScore ?? 0) > (homeScore ?? 0) ? "text-white" : "text-gray-400"}`}>
                {awayScore ?? 0}
              </span>
            )}
          </div>
        </div>

        {/* League badge */}
        {leagueName && (
          <div className="hidden sm:block shrink-0">
            <span className="text-[10px] text-gray-500">{leagueName}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
