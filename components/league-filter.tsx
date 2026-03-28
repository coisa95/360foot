"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

/* eslint-disable @typescript-eslint/no-explicit-any */

function buildHref(selectedDateStr: string, todayDateStr: string, ligueSlug?: string): string {
  const params = new URLSearchParams();
  if (selectedDateStr !== todayDateStr) params.set("date", selectedDateStr);
  if (ligueSlug) params.set("ligue", ligueSlug);
  const qs = params.toString();
  return `/matchs${qs ? `?${qs}` : ""}`;
}

export function LeagueFilter({
  leagues,
  selectedDateStr,
  currentLigue,
  todayDateStr,
}: {
  leagues: any[];
  selectedDateStr: string;
  currentLigue?: string;
  todayDateStr: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2">
        <Link
          href={buildHref(selectedDateStr, todayDateStr)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            !currentLigue
              ? "bg-lime-500 text-black"
              : "bg-dark-card text-gray-400 hover:bg-dark-surface hover:text-white"
          }`}
        >
          Toutes
        </Link>

        {currentLigue && (
          <span className="flex items-center gap-1.5 rounded-full bg-lime-500 px-3 py-1.5 text-xs font-medium text-black">
            {(() => {
              const found = leagues.find((l) => l.slug === currentLigue);
              return (
                <>
                  {found?.logo_url && (
                    <Image src={found.logo_url} alt="" width={14} height={14} className="h-3.5 w-3.5 object-contain" />
                  )}
                  {found?.name || currentLigue}
                </>
              );
            })()}
          </span>
        )}

        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Filtrer par ligue"
          className="flex items-center gap-1 rounded-full bg-dark-card px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-dark-surface hover:text-white transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtrer
          <svg
            className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="mt-2 rounded-lg border border-gray-800 bg-dark-card/50 p-2 max-h-72 overflow-y-auto">
          {leagues.map((l: any) => (
            <Link
              key={l.slug}
              href={buildHref(selectedDateStr, todayDateStr, l.slug)}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                currentLigue === l.slug
                  ? "bg-lime-500/15 text-lime-400"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {l.logo_url ? (
                <Image src={l.logo_url} alt="" width={20} height={20} className="h-5 w-5 object-contain shrink-0" />
              ) : (
                <div className="h-5 w-5 rounded bg-gray-700 flex items-center justify-center text-[10px] text-gray-500 shrink-0">
                  {l.name?.charAt(0)}
                </div>
              )}
              <span className="truncate">{l.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
