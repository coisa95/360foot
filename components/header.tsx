"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/actu", label: "Actualités" },
  { href: "/resultats", label: "Résultats" },
  { href: "/transferts", label: "Transferts" },
  { href: "/bons-plans", label: "Bons Plans" },
];

const DROPDOWN_LEAGUES = [
  { href: "/ligue/ligue-1-cote-divoire", label: "🇨🇮 Ligue 1 Côte d'Ivoire" },
  { href: "/ligue/ligue-pro-senegal", label: "🇸🇳 Ligue Pro Sénégal" },
  { href: "/ligue/elite-one-cameroun", label: "🇨🇲 Elite One Cameroun" },
  { href: "/ligue/ligue-1-france", label: "🇫🇷 Ligue 1 France" },
  { href: "/ligue/premier-league", label: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League" },
  { href: "/ligue/la-liga", label: "🇪🇸 La Liga" },
  { href: "/ligue/champions-league", label: "🏆 Champions League" },
];

const MOBILE_LEAGUES = [
  { href: "/ligue/ligue-1-cote-divoire", label: "🇨🇮 Ligue 1 CI" },
  { href: "/ligue/ligue-pro-senegal", label: "🇸🇳 Ligue Pro SN" },
  { href: "/ligue/elite-one-cameroun", label: "🇨🇲 Elite One CM" },
  { href: "/ligue/championnat-national-benin", label: "🇧🇯 Champ. Bénin" },
  { href: "/ligue/linafoot-ligue-1", label: "🇨🇩 Linafoot RDC" },
  { href: "/ligue/ligue-1-france", label: "🇫🇷 Ligue 1" },
  { href: "/ligue/premier-league", label: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League" },
  { href: "/ligue/la-liga", label: "🇪🇸 La Liga" },
  { href: "/ligue/serie-a", label: "🇮🇹 Serie A" },
  { href: "/ligue/bundesliga", label: "🇩🇪 Bundesliga" },
  { href: "/ligue/champions-league", label: "🏆 Champions League" },
  { href: "/ligue/mls", label: "🇺🇸 MLS" },
  { href: "/ligue/saudi-pro-league", label: "🇸🇦 Saudi Pro League" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileLiguesOpen, setMobileLiguesOpen] = useState(false);
  const [liguesDropdownOpen, setLiguesDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-dark-border/50 bg-dark-bg/90 backdrop-blur-xl shadow-lg shadow-black/20">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/logo-360.png"
            alt="Logo 360 Foot"
            width={40}
            height={40}
            className="rounded-lg transition-all group-hover:scale-105"
          />
          <span className="text-xl font-bold">
            <span className="text-white">360</span>{" "}
            <span className="bg-gradient-to-r from-lime-400 to-emerald-400 bg-clip-text text-transparent">Foot</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-gray-400 transition-colors hover:text-lime-400"
            >
              {link.label}
            </Link>
          ))}

          {/* Ligues Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setLiguesDropdownOpen(true)}
            onMouseLeave={() => setLiguesDropdownOpen(false)}
          >
            <button className="flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-lime-400">
              Ligues
              <svg className={`h-3 w-3 transition-transform ${liguesDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {liguesDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-dark-border bg-dark-bg/95 backdrop-blur-xl shadow-xl shadow-black/30 py-2 z-50">
                {DROPDOWN_LEAGUES.map((league) => (
                  <Link
                    key={league.href}
                    href={league.href}
                    className="block px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-dark-card hover:text-lime-400"
                  >
                    {league.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-lime-400 lg:hidden"
          aria-label="Menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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

            {/* Mobile Ligues accordion */}
            <div className="mt-1 border-t border-dark-border pt-1">
              <button
                onClick={() => setMobileLiguesOpen(!mobileLiguesOpen)}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-dark-card hover:text-lime-400"
              >
                Ligues
                <svg className={`h-3 w-3 transition-transform ${mobileLiguesOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {mobileLiguesOpen && (
                <div className="ml-2">
                  {MOBILE_LEAGUES.map((league) => (
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
