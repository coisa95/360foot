"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface LeagueTabsProps {
  leagueSlug: string;
}

const TABS = [
  { key: "classement", label: "Classement", path: "" },
  { key: "resultats", label: "Résultats", path: "/resultats" },
  { key: "calendrier", label: "Calendrier", path: "/calendrier" },
  { key: "buteurs", label: "Buteurs", path: "/buteurs" },
  { key: "passeurs", label: "Passeurs", path: "/passeurs" },
  { key: "actualites", label: "Actualités", path: "/actualites" },
];

export default function LeagueTabs({ leagueSlug }: LeagueTabsProps) {
  const pathname = usePathname();

  function isActive(tabPath: string) {
    const base = `/ligue/${leagueSlug}`;
    if (tabPath === "") return pathname === base || pathname === `${base}/`;
    return pathname.startsWith(`${base}${tabPath}`);
  }

  return (
    <nav className="overflow-x-auto scrollbar-hide">
      <div className="flex">
        {TABS.map((tab) => {
          const active = isActive(tab.path);
          return (
            <Link
              key={tab.key}
              href={`/ligue/${leagueSlug}${tab.path}`}
              className={`px-2.5 sm:px-5 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                active
                  ? "text-emerald-600 border-emerald-500"
                  : "text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
