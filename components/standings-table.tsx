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

  return (
    <div className="rounded-xl border border-dark-border/50 bg-dark-card/80 shadow-lg shadow-black/10 backdrop-blur-sm overflow-hidden">
      <div className={`flex items-center justify-between border-b border-dark-border/50 bg-gradient-to-r from-dark-surface/50 to-transparent ${compact ? "px-3 py-2" : "px-4 py-3"}`}>
        <h3 className={`font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent ${compact ? "text-xs" : "text-sm"}`}>{leagueName}</h3>
        {compact && (
          <Link
            href={`/ligue/${leagueSlug}/classement`}
            className="text-[10px] text-lime-400 hover:underline"
          >
            Voir tout
          </Link>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-dark-border hover:bg-transparent">
            <TableHead className={`text-gray-500 ${compact ? "w-6 px-2 py-1 text-[10px]" : "w-8"}`}>#</TableHead>
            <TableHead className={`text-gray-500 ${compact ? "px-1 py-1 text-[10px]" : ""}`}>Équipe</TableHead>
            <TableHead className={`text-center text-gray-500 ${compact ? "px-1 py-1 text-[10px]" : ""}`}>MJ</TableHead>
            {!compact && (
              <>
                <TableHead className="text-center text-gray-500">V</TableHead>
                <TableHead className="text-center text-gray-500">N</TableHead>
                <TableHead className="text-center text-gray-500">D</TableHead>
                <TableHead className="text-center text-gray-500">BP</TableHead>
                <TableHead className="text-center text-gray-500">BC</TableHead>
              </>
            )}
            <TableHead className={`text-center text-gray-500 ${compact ? "px-1 py-1 text-[10px]" : ""}`}>Diff</TableHead>
            <TableHead className={`text-center text-gray-500 ${compact ? "px-1 py-1 text-[10px]" : ""}`}>Pts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.rank}
              className="border-dark-border hover:bg-dark-surface"
            >
              <TableCell className={`text-gray-400 ${compact ? "px-2 py-1 text-[10px]" : "text-xs"}`}>{row.rank}</TableCell>
              <TableCell className={compact ? "px-1 py-1" : ""}>
                <Link
                  href={`/equipe/${row.teamSlug}`}
                  className={`flex items-center gap-1.5 text-white hover:text-lime-400 ${compact ? "text-xs" : "text-sm"}`}
                >
                  {row.teamLogo && (
                    <Image src={row.teamLogo} alt={`Logo ${row.teamName}`} width={16} height={16} className="w-4 h-4 object-contain shrink-0" unoptimized />
                  )}
                  <span className="truncate">{row.teamName}</span>
                </Link>
              </TableCell>
              <TableCell className={`text-center text-gray-400 ${compact ? "px-1 py-1 text-xs" : "text-sm"}`}>
                {row.played}
              </TableCell>
              {!compact && (
                <>
                  <TableCell className="text-center text-sm text-gray-400">
                    {row.won}
                  </TableCell>
                  <TableCell className="text-center text-sm text-gray-400">
                    {row.drawn}
                  </TableCell>
                  <TableCell className="text-center text-sm text-gray-400">
                    {row.lost}
                  </TableCell>
                  <TableCell className="text-center text-sm text-gray-400">
                    {row.goalsFor}
                  </TableCell>
                  <TableCell className="text-center text-sm text-gray-400">
                    {row.goalsAgainst}
                  </TableCell>
                </>
              )}
              <TableCell className={`text-center text-gray-400 ${compact ? "px-1 py-1 text-xs" : "text-sm"}`}>
                {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
              </TableCell>
              <TableCell className={`text-center font-bold text-lime-400 ${compact ? "px-1 py-1 text-xs" : "text-sm"}`}>
                {row.points}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
