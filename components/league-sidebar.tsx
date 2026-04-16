import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

interface League {
  id: string;
  name: string;
  slug: string;
  country: string;
  country_code: string;
  logo_url: string | null;
}

const AFRICA_CODES = new Set(["CI", "SN", "CM", "ML", "BF", "BJ", "CD"]);
const EUROPE_CODES = new Set(["FR", "GB", "ES", "IT", "DE"]);
const COMPETITION_SLUGS = new Set([
  "champions-league",
  "europa-league",
  "conference-league",
  "coupe-d-afrique-des-nations",
  "can",
]);

interface LeagueSidebarProps {
  activeSlug?: string;
}

interface LeagueGroup {
  label: string;
  leagues: League[];
}

function categorizeLeagues(leagues: League[]): LeagueGroup[] {
  const africa: League[] = [];
  const europe: League[] = [];
  const competitions: League[] = [];
  const autres: League[] = [];

  for (const league of leagues) {
    // Competitions: no real country or known competition slugs
    if (
      COMPETITION_SLUGS.has(league.slug) ||
      league.country_code === "INTL" ||
      league.country_code === "EU" ||
      league.country_code === "AF"
    ) {
      competitions.push(league);
    } else if (AFRICA_CODES.has(league.country_code)) {
      africa.push(league);
    } else if (EUROPE_CODES.has(league.country_code)) {
      europe.push(league);
    } else {
      autres.push(league);
    }
  }

  const groups: LeagueGroup[] = [];
  if (africa.length > 0) groups.push({ label: "Afrique", leagues: africa });
  if (europe.length > 0) groups.push({ label: "Europe", leagues: europe });
  if (autres.length > 0) groups.push({ label: "Autres", leagues: autres });
  if (competitions.length > 0)
    groups.push({ label: "Comp\u00e9titions", leagues: competitions });

  return groups;
}

export async function LeagueSidebar({ activeSlug }: LeagueSidebarProps) {
  const supabase = createClient();
  const { data: leagues } = await supabase
    .from("leagues")
    .select("id,name,slug,country,country_code,logo_url")
    .order("name", { ascending: true });

  if (!leagues || leagues.length === 0) return null;

  const groups = categorizeLeagues(leagues as League[]);

  // Flatten all leagues for mobile horizontal scroll
  const allLeagues = groups.flatMap((g) => g.leagues);

  return (
    <>
      {/* Mobile: horizontal scrollable league bar */}
      <nav
        aria-label="Ligues"
        className="lg:hidden overflow-x-auto scrollbar-hide border-b border-slate-200 bg-white/90 backdrop-blur-sm"
      >
        <div className="flex items-center gap-1 px-3 py-2">
          <Link
            href="/competitions"
            className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
          >
            Toutes
          </Link>
          {allLeagues.map((league) => {
            const isActive = activeSlug === league.slug;
            return (
              <Link
                key={league.id}
                href={`/ligue/${league.slug}`}
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-emerald-600"
                }`}
              >
                {league.logo_url ? (
                  <Image
                    src={league.logo_url}
                    alt=""
                    width={14}
                    height={14}
                    className="h-3.5 w-3.5 shrink-0 rounded-sm object-contain"
                  />
                ) : null}
                <span className="whitespace-nowrap">{league.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop: fixed sidebar */}
      <aside className="hidden lg:block fixed top-[65px] left-0 z-40 max-h-[calc(100vh-65px)] w-56 overflow-y-auto border-r border-slate-200 bg-white/90 backdrop-blur-sm scrollbar-hide hover:scrollbar-thin hover:scrollbar-track-transparent hover:scrollbar-thumb-slate-300">
        <nav aria-label="Ligues" className="py-3">
          {groups.map((group) => (
            <div key={group.label} className="mb-2">
              {/* Group heading */}
              <h3 className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-900">
                {group.label}
              </h3>

              {/* League links */}
              <ul>
                {group.leagues.map((league) => {
                  const isActive = activeSlug === league.slug;
                  return (
                    <li key={league.id}>
                      <Link
                        href={`/ligue/${league.slug}`}
                        className={`flex items-center gap-2.5 px-4 py-1.5 text-sm transition-colors ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 font-medium"
                            : "text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
                        }`}
                      >
                        {league.logo_url ? (
                          <Image
                            src={league.logo_url}
                            alt={`Logo ${league.name}`}
                            width={20}
                            height={20}
                            className="h-5 w-5 shrink-0 rounded-sm object-contain"
                          />
                        ) : (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-slate-100 text-[10px] text-slate-400">
                            {league.country_code}
                          </span>
                        )}
                        <span className="truncate">{league.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
