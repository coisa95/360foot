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
              <a href="https://twitter.com/360foot" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X" className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 transition-colors">
                <svg className="w-3.5 h-3.5 text-slate-700" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://www.instagram.com/360foot" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex items-center justify-center w-7 h-7 rounded-full bg-pink-50 hover:bg-pink-100 transition-colors">
                <svg className="w-3.5 h-3.5 text-[#E4405F]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z"/></svg>
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
