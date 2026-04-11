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
  NS: { label: "À venir", full: "À venir", color: "text-blue-600", bg: "bg-blue-50" },
  "1H": { label: "1MT", full: "1ère mi-temps", color: "text-red-600", bg: "bg-red-50" },
  HT: { label: "MT", full: "Mi-temps", color: "text-yellow-600", bg: "bg-yellow-50" },
  "2H": { label: "2MT", full: "2ème mi-temps", color: "text-red-600", bg: "bg-red-50" },
  FT: { label: "Terminé", full: "Terminé", color: "text-emerald-600", bg: "bg-emerald-50" },
  AET: { label: "AP", full: "Après prolongations", color: "text-emerald-600", bg: "bg-emerald-50" },
  PEN: { label: "TAB", full: "Tirs au but", color: "text-emerald-600", bg: "bg-emerald-50" },
  PST: { label: "Reporté", full: "Reporté", color: "text-orange-600", bg: "bg-orange-50" },
  CANC: { label: "Annulé", full: "Annulé", color: "text-red-600", bg: "bg-red-50" },
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
    <Link href={`/match/${slug}`} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded-xl">
      <div className={`relative rounded-xl border bg-white/80 backdrop-blur-sm px-3.5 py-3 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5 overflow-hidden ${isLive ? "border-red-300 hover:border-red-400" : "border-slate-200/80 hover:border-emerald-500/30"}`}>
        {/* Gradient accent top */}
        <div className={`absolute top-0 left-0 right-0 h-[2px] ${isLive ? "bg-gradient-to-r from-red-500 via-orange-500 to-red-500" : "bg-gradient-to-r from-emerald-500/0 via-emerald-500/30 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity"}`} />

        {/* League name */}
        {leagueName && (
          <p className="text-[10px] text-slate-400 mb-2 truncate">{leagueName}</p>
        )}

        {/* Match content */}
        <div className="flex items-center gap-3">
          {/* Teams */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                  {homeLogoUrl ? (
                    <Image src={homeLogoUrl} alt={`Logo ${homeTeam}`} width={20} height={20} className="w-5 h-5 object-contain" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-slate-100" />
                  )}
                </div>
                <span className={`text-sm font-medium truncate ${status !== "NS" && (homeScore ?? 0) > (awayScore ?? 0) ? "text-slate-900 font-semibold" : "text-slate-600"} group-hover:text-slate-900 transition-colors`}>{homeTeam}</span>
              </div>
              {status !== "NS" && (
                <span className={`text-sm font-bold tabular-nums shrink-0 ${(homeScore ?? 0) > (awayScore ?? 0) ? "text-slate-900" : "text-slate-400"}`}>
                  {homeScore ?? 0}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                  {awayLogoUrl ? (
                    <Image src={awayLogoUrl} alt={`Logo ${awayTeam}`} width={20} height={20} className="w-5 h-5 object-contain" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-slate-100" />
                  )}
                </div>
                <span className={`text-sm font-medium truncate ${status !== "NS" && (awayScore ?? 0) > (homeScore ?? 0) ? "text-slate-900 font-semibold" : "text-slate-600"} group-hover:text-slate-900 transition-colors`}>{awayTeam}</span>
              </div>
              {status !== "NS" && (
                <span className={`text-sm font-bold tabular-nums shrink-0 ${(awayScore ?? 0) > (homeScore ?? 0) ? "text-slate-900" : "text-slate-400"}`}>
                  {awayScore ?? 0}
                </span>
              )}
            </div>
          </div>

          {/* Separator */}
          <div className="w-px h-8 bg-slate-200 shrink-0" />

          {/* Status / Time */}
          <div className="w-14 shrink-0 text-center">
            {status === "NS" ? (
              <div>
                <p className="text-sm font-bold text-blue-600">{timeStr}</p>
                <p className="text-[10px] text-slate-400">{dateStr}</p>
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
