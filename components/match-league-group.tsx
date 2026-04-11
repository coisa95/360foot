"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function MatchLeagueGroup({
  leagueName,
  leagueSlug,
  leagueLogo,
  matches,
  defaultOpen = true,
}: {
  leagueName: string;
  leagueSlug: string;
  leagueLogo: string | null;
  matches: any[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className="border-slate-200 bg-white/80 backdrop-blur-sm overflow-hidden">
      {/* League header — clickable to toggle */}
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={`${open ? "Masquer" : "Afficher"} les matchs de ${leagueName}`}
        className="flex w-full items-center gap-2 px-4 py-2.5 bg-slate-50/50 border-b border-slate-100 hover:bg-slate-50 transition-colors"
      >
        {leagueLogo && (
          <Image src={leagueLogo} alt={`Logo ${leagueName}`} width={16} height={16} className="h-4 w-4 object-contain" />
        )}
        <Link
          href={`/ligue/${leagueSlug}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs font-semibold text-slate-700 hover:text-emerald-600 transition-colors"
        >
          {leagueName}
        </Link>
        <span className="ml-auto text-[10px] text-slate-400">{matches.length}</span>
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Match rows */}
      {open && (
        <div className="divide-y divide-slate-100">
          {matches.map((match: any) => {
            const homeTeam = match.home_team;
            const awayTeam = match.away_team;
            const isFinished = ["FT", "AET", "PEN"].includes(match.status);
            const isLive = ["1H", "2H", "HT", "ET", "P", "BT"].includes(match.status);
            const isUpcoming = match.status === "NS";
            const matchTime = new Date(match.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

            return (
              <Link
                key={match.slug}
                href={`/match/${match.slug}`}
                className="flex items-center px-4 py-2.5 hover:bg-slate-50 transition-colors"
              >
                {/* Time / Status */}
                <div className="w-14 shrink-0 text-center">
                  {isUpcoming && (
                    <span className="text-xs font-bold text-blue-600">{matchTime}</span>
                  )}
                  {isLive && (
                    <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px] animate-pulse">
                      EN COURS
                    </Badge>
                  )}
                  {isFinished && (
                    <span className="text-[10px] font-semibold text-emerald-600">
                      {match.status === "AET" ? "A.P." : match.status === "PEN" ? "T.A.B." : "Terminé"}
                    </span>
                  )}
                  {!isUpcoming && !isLive && !isFinished && (
                    <span className="text-[10px] text-slate-400">{match.status}</span>
                  )}
                </div>

                {/* Teams */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {homeTeam?.logo_url && (
                        <Image src={homeTeam.logo_url} alt={`Logo ${homeTeam.name}`} width={18} height={18} className="h-4.5 w-4.5 object-contain shrink-0" />
                      )}
                      <span className={`text-xs sm:text-sm truncate ${isFinished && (match.score_home ?? 0) > (match.score_away ?? 0) ? "font-bold text-slate-900" : "text-slate-600"}`}>
                        {homeTeam?.name || "Équipe A"}
                      </span>
                    </div>
                    {!isUpcoming && (
                      <span className={`text-sm font-bold tabular-nums shrink-0 ${isFinished && (match.score_home ?? 0) > (match.score_away ?? 0) ? "text-slate-900" : "text-slate-400"}`}>
                        {match.score_home ?? 0}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {awayTeam?.logo_url && (
                        <Image src={awayTeam.logo_url} alt={`Logo ${awayTeam.name}`} width={18} height={18} className="h-4.5 w-4.5 object-contain shrink-0" />
                      )}
                      <span className={`text-xs sm:text-sm truncate ${isFinished && (match.score_away ?? 0) > (match.score_home ?? 0) ? "font-bold text-slate-900" : "text-slate-600"}`}>
                        {awayTeam?.name || "Équipe B"}
                      </span>
                    </div>
                    {!isUpcoming && (
                      <span className={`text-sm font-bold tabular-nums shrink-0 ${isFinished && (match.score_away ?? 0) > (match.score_home ?? 0) ? "text-slate-900" : "text-slate-400"}`}>
                        {match.score_away ?? 0}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}
