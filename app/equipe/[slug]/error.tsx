"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h2 className="text-2xl font-bold text-white mb-4">Une erreur est survenue</h2>
      <p className="text-gray-400 mb-6">
        Impossible de charger cette équipe. Veuillez réessayer.
      </p>
      <button
        onClick={() => reset()}
        className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
      >
        Réessayer
      </button>
    </div>
  );
}
