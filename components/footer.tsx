import Link from "next/link";

const FOOTER_LINKS = {
  Ligues: [
    { href: "/ligue/ligue-1-cote-divoire", label: "Ligue 1 Côte d'Ivoire" },
    { href: "/ligue/ligue-pro-senegal", label: "Ligue Pro Sénégal" },
    { href: "/ligue/elite-one-cameroun", label: "Elite One Cameroun" },
    { href: "/ligue/ligue-1-france", label: "Ligue 1 France" },
    { href: "/ligue/premier-league", label: "Premier League" },
    { href: "/ligue/la-liga", label: "La Liga" },
    { href: "/ligue/champions-league", label: "Champions League" },
  ],
  Classements: [
    { href: "/classement/ligue-1-cote-divoire", label: "Classement Ligue 1 CI" },
    { href: "/classement/ligue-pro-senegal", label: "Classement Ligue Pro SN" },
    { href: "/classement/elite-one-cameroun", label: "Classement Elite One CM" },
    { href: "/classement/premier-league", label: "Classement Premier League" },
    { href: "/classement/la-liga", label: "Classement La Liga" },
    { href: "/classement/champions-league", label: "Classement Champions League" },
  ],
  Rubriques: [
    { href: "/actu", label: "Actualités" },
    { href: "/resultats", label: "Résultats" },
    { href: "/transferts", label: "Transferts" },
    { href: "/actu?categorie=preview", label: "Avant-matchs" },
    { href: "/actu?categorie=recap", label: "Récaps" },
    { href: "/bookmakers", label: "Paris sportifs" },
  ],
  Infos: [
    { href: "/a-propos", label: "À propos" },
    { href: "/methodologie", label: "Méthodologie IA" },
    { href: "/confidentialite", label: "Confidentialité" },
    { href: "/mentions-legales", label: "Mentions légales" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-dark-border/50 bg-dark-bg bg-glow-blue">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-lime-400 to-emerald-500 text-sm font-bold text-dark-bg shadow-lg shadow-lime-500/20">
                360
              </div>
              <span className="text-lg font-bold">
                <span className="text-white">360</span>{" "}
                <span className="bg-gradient-to-r from-lime-400 to-emerald-400 bg-clip-text text-transparent">Foot</span>
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
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider bg-gradient-to-r from-gray-300 to-gray-500 bg-clip-text text-transparent">
                {title}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href + link.label}>
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
