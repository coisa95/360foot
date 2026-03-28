import Link from "next/link";
import Image from "next/image";

const FOOTER_LINKS = {
  Rubriques: [
    { href: "/competitions", label: "Compétitions" },
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
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-12">
          {/* Brand */}
          <div className="shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo-360.png" alt="360 Foot" width={28} height={28} className="rounded" />
              <span className="text-sm font-bold">
                <span className="text-white">360</span>{" "}
                <span className="text-lime-400">Foot</span>
              </span>
            </Link>
            <p className="mt-1.5 text-[10px] text-gray-500 max-w-[200px] leading-relaxed">
              Football d&apos;Afrique et d&apos;Europe — résultats, classements, transferts.
            </p>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {title}
              </h3>
              <ul className="space-y-0.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[11px] text-gray-500 transition-colors hover:text-lime-400"
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
        <div className="mt-4 border-t border-dark-border/50 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 rounded border border-yellow-500/20 bg-yellow-500/5 px-2.5 py-1.5">
            <span className="text-[10px] font-semibold text-yellow-400">18+ | Jeu responsable</span>
            <span className="text-[9px] text-yellow-400/70">— 0 974 75 13 13</span>
          </div>
          <p className="text-[10px] text-gray-600">
            &copy; {new Date().getFullYear()} 360 Foot. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
