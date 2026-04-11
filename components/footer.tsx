import Link from "next/link";
import Image from "next/image";

const RUBRIQUES = [
  { href: "/competitions", label: "Compétitions" },
  { href: "/matchs", label: "Matchs" },
  { href: "/actu", label: "Actualités" },
  { href: "/transferts", label: "Transferts" },
  { href: "/recherche", label: "Recherche" },
  { href: "/bons-plans", label: "Bons Plans" },
  { href: "/bookmakers", label: "Bookmakers" },
];

const INFOS = [
  { href: "/a-propos", label: "À propos" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/mentions-legales", label: "Mentions légales" },
];

export function Footer() {
  return (
    <footer aria-label="Pied de page" className="border-t border-slate-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-12">
          {/* Brand */}
          <div className="shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo-360.png" alt="360 Foot" width={28} height={28} className="rounded" />
              <span className="text-sm font-bold">
                <span className="text-slate-900">360</span>{" "}
                <span className="text-emerald-600 font-extrabold">Foot</span>
              </span>
            </Link>
            <p className="mt-1.5 text-[10px] text-slate-500 max-w-[220px] leading-relaxed">
              Football africain et européen — résultats, classements, transferts.
            </p>
            {/* Social */}
            <div className="mt-2 flex items-center gap-2">
              <a href="https://web.facebook.com/foot360news" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors">
                <svg className="w-3.5 h-3.5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://t.me/foot360news" target="_blank" rel="noopener noreferrer" aria-label="Telegram" className="flex items-center justify-center w-7 h-7 rounded-full bg-sky-50 hover:bg-sky-100 transition-colors">
                <svg className="w-3.5 h-3.5 text-[#0088cc]" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </a>
            </div>
          </div>

          {/* Links: Rubriques + Infos side by side */}
          <div className="flex gap-10 sm:gap-16">
            <div>
              <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Rubriques
              </h3>
              <ul className="space-y-0.5">
                {RUBRIQUES.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[11px] text-slate-500 transition-colors hover:text-emerald-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Infos
              </h3>
              <ul className="space-y-0.5">
                {INFOS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[11px] text-slate-500 transition-colors hover:text-emerald-600"
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
        <div className="mt-4 border-t border-slate-200 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 rounded border border-amber-300 bg-amber-50 px-2.5 py-1.5">
            <span className="text-[10px] font-semibold text-amber-700">18+ | Jeu responsable</span>
            <span className="text-[9px] text-amber-600">— 0 974 75 13 13</span>
          </div>
          <p className="text-[10px] text-gray-500">
            &copy; {new Date().getFullYear()} 360 Foot. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
