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

const STATUS_LABELS: Record<string, { label: string; full: string; color: string; bg: string }> = {
  NS: { label: "À venir", full: "À venir", color: "text-blue-400", bg: "bg-blue-500/10" },
  "1H": { label: "1MT", full: "1ère mi-temps", color: "text-red-400", bg: "bg-red-500/15" },
  HT: { label: "MT", full: "Mi-temps", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  "2H": { label: "2MT", full: "2ème mi-temps", color: "text-red-400", bg: "bg-red-500/15" },
  FT: { label: "Terminé", full: "Terminé", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  AET: { label: "AP", full: "Après prolongations", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  PEN: { label: "TAB", full: "Tirs au but", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  PST: { label: "Reporté", full: "Reporté", color: "text-orange-400", bg: "bg-orange-500/10" },
  CANC: { label: "Annulé", full: "Annulé", color: "text-red-400", bg: "bg-red-500/10" },
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
    <Link href={`/match/${slug}`} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-bg rounded-xl">
      <div className={`relative rounded-xl border bg-dark-card/60 backdrop-blur-sm px-3.5 py-3 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 overflow-hidden ${isLive ? "border-red-500/40 hover:border-red-500/60" : "border-dark-border/40 hover:border-lime-500/25"}`}>
        {/* Gradient accent top */}
        <div className={`absolute top-0 left-0 right-0 h-[2px] ${isLive ? "bg-gradient-to-r from-red-500 via-orange-500 to-red-500" : "bg-gradient-to-r from-lime-500/0 via-lime-500/30 to-lime-500/0 opacity-0 group-hover:opacity-100 transition-opacity"}`} />

        {/* League name */}
        {leagueName && (
          <p className="text-[10px] text-gray-500 mb-2 truncate">{leagueName}</p>
        )}

        {/* Match content */}
        <div className="flex items-center gap-3">
          {/* Teams */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                  {homeLogoUrl ? (
                    <Image src={homeLogoUrl} alt={`Logo ${homeTeam}`} width={20} height={20} className="w-5 h-5 object-contain" unoptimized />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-dark-surface" />
                  )}
                </div>
                <span className={`text-sm font-medium truncate ${status !== "NS" && (homeScore ?? 0) > (awayScore ?? 0) ? "text-white" : "text-gray-300"} group-hover:text-white transition-colors`}>{homeTeam}</span>
              </div>
              {status !== "NS" && (
                <span className={`text-sm font-bold tabular-nums shrink-0 ${(homeScore ?? 0) > (awayScore ?? 0) ? "text-white" : "text-gray-500"}`}>
                  {homeScore ?? 0}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                  {awayLogoUrl ? (
                    <Image src={awayLogoUrl} alt={`Logo ${awayTeam}`} width={20} height={20} className="w-5 h-5 object-contain" unoptimized />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-dark-surface" />
                  )}
                </div>
                <span className={`text-sm font-medium truncate ${status !== "NS" && (awayScore ?? 0) > (homeScore ?? 0) ? "text-white" : "text-gray-300"} group-hover:text-white transition-colors`}>{awayTeam}</span>
              </div>
              {status !== "NS" && (
                <span className={`text-sm font-bold tabular-nums shrink-0 ${(awayScore ?? 0) > (homeScore ?? 0) ? "text-white" : "text-gray-500"}`}>
                  {awayScore ?? 0}
                </span>
              )}
            </div>
          </div>

          {/* Separator */}
          <div className="w-px h-8 bg-dark-border/50 shrink-0" />

          {/* Status / Time */}
          <div className="w-14 shrink-0 text-center">
            {status === "NS" ? (
              <div>
                <p className="text-sm font-bold text-blue-400">{timeStr}</p>
                <p className="text-[10px] text-gray-500">{dateStr}</p>
              </div>
            ) : (
              <div className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 ${statusConf.bg}`}>
                {isLive && <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" /></span>}
                <span className={`text-[10px] font-semibold ${statusConf.color}`} title={statusConf.full}>
                  {statusConf.label}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
