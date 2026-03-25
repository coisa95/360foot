import Link from "next/link";

const FOOTER_LINKS = {
  Ligues: [
    { href: "/ligue/ligue-1-cote-divoire", label: "Ligue 1 Côte d'Ivoire" },
    { href: "/ligue/ligue-pro-senegal", label: "Ligue Pro Sénégal" },
    { href: "/ligue/elite-one-cameroun", label: "Elite One Cameroun" },
    { href: "/ligue/premier-league", label: "Premier League" },
    { href: "/ligue/champions-league", label: "Champions League" },
  ],
  Rubriques: [
    { href: "/transferts", label: "Transferts" },
    { href: "/bookmakers", label: "Paris sportifs" },
    { href: "/a-propos", label: "À propos" },
    { href: "/methodologie", label: "Méthodologie IA" },
  ],
  Légal: [
    { href: "/confidentialite", label: "Confidentialité" },
    { href: "/mentions-legales", label: "Mentions légales" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-dark-border bg-dark-bg">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-lime-500 to-lime-400 text-sm font-bold text-dark-bg">
                360
              </div>
              <span className="text-lg font-bold text-white">
                360 <span className="text-lime-400">Foot</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-gray-500">
              Toute l&apos;actualité football d&apos;Afrique et d&apos;Europe. Résultats,
              classements, transferts — 24/7.
            </p>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
                {title}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 transition-colors hover:text-lime-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Responsible Gaming + Copyright */}
        <div className="mt-10 border-t border-dark-border pt-6">
          <p className="text-center text-xs text-gray-600">
            18+ | Jouer comporte des risques : endettement, isolement, dépendance.
            Appelez le 0 974 75 13 13 (appel non surtaxé).
          </p>
          <p className="mt-2 text-center text-xs text-gray-600">
            &copy; {new Date().getFullYear()} 360 Foot. Tous droits réservés. Contenu
            généré par intelligence artificielle.
          </p>
        </div>
      </div>
    </footer>
  );
}
