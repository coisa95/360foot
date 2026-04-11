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
      <h2 className="text-2xl font-semibold font-display text-slate-900 mb-3">
        Page introuvable
      </h2>
      <p className="text-slate-500 mb-8">
        La page que vous recherchez n&apos;existe pas, a été déplacée ou est temporairement indisponible.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        <Link
          href="/"
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 hover:text-emerald-600"
        >
          Accueil
        </Link>
        <Link
          href="/actu"
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 hover:text-emerald-600"
        >
          Actualités
        </Link>
        <Link
          href="/matchs"
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 hover:text-emerald-600"
        >
          Résultats
        </Link>
        <Link
          href="/transferts"
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 hover:text-emerald-600"
        >
          Transferts
        </Link>
        <Link
          href="/bookmakers"
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 hover:text-emerald-600"
        >
          Paris sportifs
        </Link>
        <Link
          href="/actu"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600 transition-all hover:bg-emerald-50"
        >
          Toutes les actus
        </Link>
      </div>

      <p className="text-xs text-slate-400">
        Si le problème persiste, retournez à l&apos;<Link href="/" className="text-emerald-600 hover:underline">accueil</Link>.
      </p>
    </div>
  );
}
