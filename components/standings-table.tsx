import Link from "next/link";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StandingRow {
  rank: number;
  teamName: string;
  teamSlug: string;
  teamLogo?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

interface StandingsTableProps {
  leagueName: string;
  leagueSlug: string;
  standings: StandingRow[];
  compact?: boolean;
}

export function StandingsTable({
  leagueName,
  leagueSlug,
  standings,
  compact = false,
}: StandingsTableProps) {
  const rows = compact ? standings.slice(0, 5) : standings;

  // ── Mode compact : mini-classement épuré pour la homepage ──
  if (compact) {
    return (
      <div className="rounded-lg border border-slate-200/80 bg-white/80 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-display text-[11px] font-semibold text-slate-900 truncate">{leagueName}</h3>
          <Link
            href={`/ligue/${leagueSlug}/classement`}
            className="text-[10px] text-emerald-600 hover:underline shrink-0 ml-2"
          >
            Voir tout →
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {rows.map((row) => (
            <Link
              key={row.rank}
              href={`/equipe/${row.teamSlug}`}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 transition-colors"
            >
              <span className="w-4 text-[10px] text-slate-400 text-center shrink-0">{row.rank}</span>
              {row.teamLogo && (
                <Image src={row.teamLogo} alt={`Logo ${row.teamName}`} width={14} height={14} className="w-3.5 h-3.5 object-contain shrink-0" />
              )}
              <span className="text-[11px] text-slate-700 truncate flex-1">{row.teamName}</span>
              <span className="text-[10px] text-slate-400 w-5 text-center shrink-0">{row.played}</span>
              <span className="text-[10px] text-slate-500 w-5 text-center shrink-0">{row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}</span>
              <span className="text-[11px] font-bold text-emerald-600 w-5 text-center shrink-0">{row.points}</span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // ── Mode complet : tableau détaillé ──
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3">
        <h3 className="font-display text-sm font-semibold text-slate-900">{leagueName}</h3>
      </div>
      <Table aria-label={`Classement ${leagueName}`}>
        <TableHeader>
          <TableRow className="border-slate-100 hover:bg-transparent">
            <TableHead scope="col" className="w-8 text-slate-400">#</TableHead>
            <TableHead scope="col" className="text-slate-400">Équipe</TableHead>
            <TableHead scope="col" className="text-center text-slate-400" abbr="Matchs joués">MJ</TableHead>
            <TableHead scope="col" className="text-center text-slate-400" abbr="Victoires">V</TableHead>
            <TableHead scope="col" className="text-center text-slate-400" abbr="Nuls">N</TableHead>
            <TableHead scope="col" className="text-center text-slate-400" abbr="Défaites">D</TableHead>
            <TableHead scope="col" className="text-center text-slate-400" abbr="Buts pour">BP</TableHead>
            <TableHead scope="col" className="text-center text-slate-400" abbr="Buts contre">BC</TableHead>
            <TableHead scope="col" className="text-center text-slate-400" abbr="Différence de buts">Diff</TableHead>
            <TableHead scope="col" className="text-center text-slate-400" abbr="Points">Pts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.rank}
              className="border-slate-100 hover:bg-slate-50"
            >
              <TableCell className="text-xs text-slate-400">{row.rank}</TableCell>
              <TableCell>
                <Link
                  href={`/equipe/${row.teamSlug}`}
                  className="flex items-center gap-1.5 text-sm text-slate-900 hover:text-emerald-600"
                >
                  {row.teamLogo && (
                    <Image src={row.teamLogo} alt={`Logo ${row.teamName}`} width={16} height={16} className="w-4 h-4 object-contain shrink-0" />
                  )}
                  <span className="truncate">{row.teamName}</span>
                </Link>
              </TableCell>
              <TableCell className="text-center text-sm text-slate-500">{row.played}</TableCell>
              <TableCell className="text-center text-sm text-slate-500">{row.won}</TableCell>
              <TableCell className="text-center text-sm text-slate-500">{row.drawn}</TableCell>
              <TableCell className="text-center text-sm text-slate-500">{row.lost}</TableCell>
              <TableCell className="text-center text-sm text-slate-500">{row.goalsFor}</TableCell>
              <TableCell className="text-center text-sm text-slate-500">{row.goalsAgainst}</TableCell>
              <TableCell className="text-center text-sm text-slate-500">
                {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
              </TableCell>
              <TableCell className="text-center text-sm font-bold text-emerald-600">{row.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
