"use client";

export function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4">
      <h2 className="text-xl font-bold text-slate-900 mb-4">
        Une erreur est survenue
      </h2>
      <p className="text-slate-500 mb-6 text-center">
        Impossible de charger cette page. Veuillez réessayer.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-emerald-400 text-black font-semibold rounded-lg hover:bg-emerald-300 transition-colors"
      >
        Réessayer
      </button>
    </div>
  );
}

export default ErrorBoundary;
