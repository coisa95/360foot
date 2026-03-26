import Link from "next/link";
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
      <div className="flex items-center justify-between border-b border-dark-border/50 px-4 py-3 bg-gradient-to-r from-dark-surface/50 to-transparent">
        <h3 className="text-sm font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{leagueName}</h3>
        {compact && (
          <Link
            href={`/classement/${leagueSlug}`}
            className="text-xs text-lime-400 hover:underline"
          >
            Voir tout
          </Link>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-dark-border hover:bg-transparent">
            <TableHead className="w-8 text-gray-500">#</TableHead>
            <TableHead className="text-gray-500">Équipe</TableHead>
            <TableHead className="text-center text-gray-500">MJ</TableHead>
            {!compact && (
              <>
                <TableHead className="text-center text-gray-500">V</TableHead>
                <TableHead className="text-center text-gray-500">N</TableHead>
                <TableHead className="text-center text-gray-500">D</TableHead>
                <TableHead className="text-center text-gray-500">BP</TableHead>
                <TableHead className="text-center text-gray-500">BC</TableHead>
              </>
            )}
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
                  className="text-sm text-white hover:text-lime-400"
                >
                  {row.teamName}
                </Link>
              </TableCell>
              <TableCell className="text-center text-sm text-gray-400">
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
              <TableCell className="text-center text-sm text-gray-400">
                {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
              </TableCell>
              <TableCell className="text-center text-sm font-bold text-lime-400">
                {row.points}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
