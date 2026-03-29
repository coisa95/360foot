import Link from "next/link";
import Image from "next/image";

const RUBRIQUES = [
  { href: "/competitions", label: "Compétitions" },
  { href: "/matchs", label: "Matchs" },
  { href: "/actu", label: "Actualités" },
  { href: "/transferts", label: "Transferts" },
  { href: "/recherche", label: "Recherche" },
  { href: "/bons-plans", label: "Bons Plans" },
];

const INFOS = [
  { href: "/a-propos", label: "À propos" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/mentions-legales", label: "Mentions légales" },
];

export function Footer() {
  return (
    <footer aria-label="Pied de page" className="border-t border-dark-border/50 bg-dark-bg">
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
            <p className="mt-1.5 text-[10px] text-gray-500 max-w-[220px] leading-relaxed">
              Football africain et européen — résultats, classements, transferts.
            </p>
            {/* Social */}
            <div className="mt-2 flex items-center gap-2">
              <a href="https://t.me/foot360news" target="_blank" rel="noopener noreferrer" aria-label="Telegram" className="flex items-center justify-center w-7 h-7 rounded-full bg-[#0088cc]/10 hover:bg-[#0088cc]/20 transition-colors">
                <svg className="w-3.5 h-3.5 text-[#0088cc]" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </a>
            </div>
          </div>

          {/* Links: Rubriques + Infos side by side */}
          <div className="flex gap-10 sm:gap-16">
            <div>
              <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Rubriques
              </h3>
              <ul className="space-y-0.5">
                {RUBRIQUES.map((link) => (
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
            <div>
              <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Infos
              </h3>
              <ul className="space-y-0.5">
                {INFOS.map((link) => (
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
          </div>
        </div>

        {/* Responsible Gaming + Copyright */}
        <div className="mt-4 border-t border-dark-border/50 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 rounded border border-yellow-500/20 bg-yellow-500/5 px-2.5 py-1.5">
            <span className="text-[10px] font-semibold text-yellow-400">18+ | Jeu responsable</span>
            <span className="text-[9px] text-yellow-400/70">— 0 974 75 13 13</span>
          </div>
          <p className="text-[10px] text-gray-500">
            &copy; {new Date().getFullYear()} 360 Foot. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
