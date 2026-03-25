"use client";

import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/actu", label: "Actualités" },
  { href: "/resultats", label: "Résultats" },
  { href: "/transferts", label: "Transferts" },
  { href: "/bookmakers", label: "Bons Plans" },
];

const LEAGUES = [
  { href: "/ligue/ligue-1-cote-divoire", label: "Ligue 1 CI" },
  { href: "/ligue/ligue-pro-senegal", label: "Ligue Pro SN" },
  { href: "/ligue/elite-one-cameroun", label: "Elite One CM" },
  { href: "/ligue/ligue-1-france", label: "Ligue 1" },
  { href: "/ligue/premier-league", label: "Premier League" },
  { href: "/ligue/la-liga", label: "La Liga" },
  { href: "/ligue/champions-league", label: "Champions League" },
];

const CLASSEMENTS = [
  { href: "/classement/ligue-1-cote-divoire", label: "Ligue 1 CI" },
  { href: "/classement/ligue-pro-senegal", label: "Ligue Pro SN" },
  { href: "/classement/elite-one-cameroun", label: "Elite One CM" },
  { href: "/classement/ligue-1-france", label: "Ligue 1" },
  { href: "/classement/premier-league", label: "Premier League" },
  { href: "/classement/la-liga", label: "La Liga" },
  { href: "/classement/champions-league", label: "Champions League" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileClassementsOpen, setMobileClassementsOpen] = useState(false);
  const [mobileLiguesOpen, setMobileLiguesOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-dark-border bg-dark-bg/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-lime-500 to-lime-400 font-bold text-dark-bg text-lg">
            360
          </div>
          <span className="text-xl font-bold text-white">
            360 <span className="text-lime-400">Foot</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-5 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-gray-400 transition-colors hover:text-lime-400"
            >
              {link.label}
            </Link>
          ))}

          {/* Classements dropdown */}
          <div className="group relative">
            <button className="flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-lime-400">
              Classements
              <svg className="h-3 w-3 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="invisible absolute left-0 top-full z-50 mt-2 w-52 rounded-lg border border-dark-border bg-dark-card p-2 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
              {CLASSEMENTS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-dark-surface hover:text-lime-400"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Ligues dropdown */}
          <div className="group relative">
            <button className="flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-lime-400">
              Ligues
              <svg className="h-3 w-3 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="invisible absolute left-0 top-full z-50 mt-2 w-52 rounded-lg border border-dark-border bg-dark-card p-2 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
              {LEAGUES.map((league) => (
                <Link
                  key={league.href}
                  href={league.href}
                  className="block rounded-md px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-dark-surface hover:text-lime-400"
                >
                  {league.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-lime-400 lg:hidden"
          aria-label="Menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="border-t border-dark-border bg-dark-bg px-4 pb-4 lg:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-dark-card hover:text-lime-400"
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile Classements accordion */}
            <div className="mt-2 border-t border-dark-border pt-2">
              <button
                onClick={() => setMobileClassementsOpen(!mobileClassementsOpen)}
                className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Classements
                <svg className={`h-3 w-3 transition-transform ${mobileClassementsOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {mobileClassementsOpen && (
                <div className="ml-2">
                  {CLASSEMENTS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-dark-card hover:text-lime-400"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Ligues accordion */}
            <div className="border-t border-dark-border pt-2">
              <button
                onClick={() => setMobileLiguesOpen(!mobileLiguesOpen)}
                className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Ligues
                <svg className={`h-3 w-3 transition-transform ${mobileLiguesOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {mobileLiguesOpen && (
                <div className="ml-2">
                  {LEAGUES.map((league) => (
                    <Link
                      key={league.href}
                      href={league.href}
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-dark-card hover:text-lime-400"
                    >
                      {league.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
