import Link from "next/link";

const FOOTER_LINKS = {
  Compétitions: [
    { href: "/ligue/ligue-1-cote-divoire", label: "Ligue 1 Côte d'Ivoire" },
    { href: "/ligue/ligue-pro-senegal", label: "Ligue Pro Sénégal" },
    { href: "/ligue/elite-one-cameroun", label: "Elite One Cameroun" },
    { href: "/ligue/championnat-national-benin", label: "Championnat Bénin" },
    { href: "/ligue/ligue-1-france", label: "Ligue 1 France" },
    { href: "/ligue/premier-league", label: "Premier League" },
    { href: "/ligue/champions-league", label: "Champions League" },
    { href: "/competitions", label: "Toutes les compétitions →" },
  ],
  Rubriques: [
    { href: "/matchs", label: "Matchs" },
    { href: "/actu", label: "Actualités" },
    { href: "/transferts", label: "Transferts" },
    { href: "/recherche", label: "Recherche" },
    { href: "/bons-plans", label: "Bons Plans" },
  ],
  Infos: [
    { href: "/a-propos", label: "À propos" },
    { href: "/confidentialite", label: "Confidentialité" },
    { href: "/mentions-legales", label: "Mentions légales" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-dark-border/50 bg-dark-bg">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-lime-400 to-emerald-500 text-[10px] font-bold text-dark-bg">
                360
              </div>
              <span className="text-sm font-bold">
                <span className="text-white">360</span>{" "}
                <span className="text-lime-400">Foot</span>
              </span>
            </Link>
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
              Football d&apos;Afrique et d&apos;Europe — résultats, classements, transferts.
            </p>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {title}
              </h3>
              <ul className="space-y-1">
                {links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-xs text-gray-500 transition-colors hover:text-lime-400"
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
        <div className="mt-6 border-t border-dark-border/50 pt-4 space-y-2">
          <div className="mx-auto max-w-md rounded border border-yellow-500/20 bg-yellow-500/5 px-3 py-2 text-center">
            <p className="text-xs font-semibold text-yellow-400">18+ | Jeu responsable</p>
            <p className="text-[10px] text-yellow-400/70">
              Jouer comporte des risques. Appelez le 0 974 75 13 13.
            </p>
          </div>
          <p className="text-center text-[10px] text-gray-600">
            &copy; {new Date().getFullYear()} 360 Foot. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
