"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4">
      <h2 className="font-display text-xl font-bold text-white mb-4">Une erreur est survenue</h2>
      <p className="text-gray-400 mb-6 text-center">
        Impossible de charger cette page. Veuillez réessayer.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition-colors"
      >
        Réessayer
      </button>
    </div>
  );
}
