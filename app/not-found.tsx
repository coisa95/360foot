import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page introuvable",
  description: "La page que vous recherchez n'existe pas ou a été déplacée.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-6xl font-bold font-display text-glow mb-4">
        404
      </h1>
      <h2 className="text-2xl font-semibold font-display text-white mb-3">
        Page introuvable
      </h2>
      <p className="text-gray-400 mb-8">
        La page que vous recherchez n&apos;existe pas, a été déplacée ou est temporairement indisponible.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        <Link
          href="/"
          className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm font-medium text-gray-300 transition-all hover:bg-white/[0.06] hover:text-emerald-400"
        >
          Accueil
        </Link>
        <Link
          href="/actu"
          className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm font-medium text-gray-300 transition-all hover:bg-white/[0.06] hover:text-emerald-400"
        >
          Actualités
        </Link>
        <Link
          href="/matchs"
          className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm font-medium text-gray-300 transition-all hover:bg-white/[0.06] hover:text-emerald-400"
        >
          Résultats
        </Link>
        <Link
          href="/transferts"
          className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm font-medium text-gray-300 transition-all hover:bg-white/[0.06] hover:text-emerald-400"
        >
          Transferts
        </Link>
        <Link
          href="/bookmakers"
          className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm font-medium text-gray-300 transition-all hover:bg-white/[0.06] hover:text-emerald-400"
        >
          Paris sportifs
        </Link>
        <Link
          href="/actu"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-500/20"
        >
          Toutes les actus
        </Link>
      </div>

      <p className="text-xs text-gray-500">
        Si le problème persiste, retournez à l&apos;<Link href="/" className="text-emerald-400 hover:underline">accueil</Link>.
      </p>
    </div>
  );
}
