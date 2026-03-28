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
              className={`px-2.5 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                active
                  ? "text-lime-400 border-lime-400"
                  : "text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-600"
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
