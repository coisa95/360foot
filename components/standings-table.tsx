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
      <div className="rounded-lg border border-dark-border/40 bg-dark-card/60 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-dark-border/30 bg-dark-surface/30">
          <h3 className="text-[11px] font-semibold text-gray-300 truncate">{leagueName}</h3>
          <Link
            href={`/ligue/${leagueSlug}/classement`}
            className="text-[10px] text-lime-400 hover:underline shrink-0 ml-2"
          >
            Voir tout →
          </Link>
        </div>
        <div className="divide-y divide-dark-border/20">
          {rows.map((row) => (
            <Link
              key={row.rank}
              href={`/equipe/${row.teamSlug}`}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-dark-surface/40 transition-colors"
            >
              <span className="w-4 text-[10px] text-gray-500 text-center shrink-0">{row.rank}</span>
              {row.teamLogo && (
                <Image src={row.teamLogo} alt={`Logo ${row.teamName}`} width={14} height={14} className="w-3.5 h-3.5 object-contain shrink-0" unoptimized />
              )}
              <span className="text-[11px] text-gray-200 truncate flex-1">{row.teamName}</span>
              <span className="text-[10px] text-gray-500 w-5 text-center shrink-0">{row.played}</span>
              <span className="text-[10px] text-gray-400 w-5 text-center shrink-0">{row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}</span>
              <span className="text-[11px] font-bold text-lime-400 w-5 text-center shrink-0">{row.points}</span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // ── Mode complet : tableau détaillé ──
  return (
    <div className="rounded-xl border border-dark-border/50 bg-dark-card/80 shadow-lg shadow-black/10 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-dark-border/50 bg-gradient-to-r from-dark-surface/50 to-transparent px-4 py-3">
        <h3 className="text-sm font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{leagueName}</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-dark-border hover:bg-transparent">
            <TableHead className="w-8 text-gray-500">#</TableHead>
            <TableHead className="text-gray-500">Équipe</TableHead>
            <TableHead className="text-center text-gray-500">MJ</TableHead>
            <TableHead className="text-center text-gray-500">V</TableHead>
            <TableHead className="text-center text-gray-500">N</TableHead>
            <TableHead className="text-center text-gray-500">D</TableHead>
            <TableHead className="text-center text-gray-500">BP</TableHead>
            <TableHead className="text-center text-gray-500">BC</TableHead>
            <TableHead className="text-center text-gray-500">Diff</TableHead>
            <TableHead className="text-center text-gray-500">Pts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.rank}
              className="border-dark-border hover:bg-dark-surface"
            >
              <TableCell className="text-xs text-gray-400">{row.rank}</TableCell>
              <TableCell>
                <Link
                  href={`/equipe/${row.teamSlug}`}
                  className="flex items-center gap-1.5 text-sm text-white hover:text-lime-400"
                >
                  {row.teamLogo && (
                    <Image src={row.teamLogo} alt={`Logo ${row.teamName}`} width={16} height={16} className="w-4 h-4 object-contain shrink-0" unoptimized />
                  )}
                  <span className="truncate">{row.teamName}</span>
                </Link>
              </TableCell>
              <TableCell className="text-center text-sm text-gray-400">{row.played}</TableCell>
              <TableCell className="text-center text-sm text-gray-400">{row.won}</TableCell>
              <TableCell className="text-center text-sm text-gray-400">{row.drawn}</TableCell>
              <TableCell className="text-center text-sm text-gray-400">{row.lost}</TableCell>
              <TableCell className="text-center text-sm text-gray-400">{row.goalsFor}</TableCell>
              <TableCell className="text-center text-sm text-gray-400">{row.goalsAgainst}</TableCell>
              <TableCell className="text-center text-sm text-gray-400">
                {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
              </TableCell>
              <TableCell className="text-center text-sm font-bold text-lime-400">{row.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
