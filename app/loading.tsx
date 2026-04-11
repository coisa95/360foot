export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Hero skeleton */}
      <div className="mb-4 md:mb-10 rounded-xl md:rounded-2xl bg-slate-100 px-4 py-3 md:p-6 animate-pulse">
        <div className="h-6 md:h-10 w-3/4 bg-slate-200 rounded-lg" />
        <div className="mt-2 h-4 w-1/2 bg-slate-200/70 rounded-lg hidden sm:block" />
      </div>

      {/* Carousel skeleton */}
      <div className="mb-4 md:mb-8 rounded-xl md:rounded-2xl bg-slate-100 animate-pulse" style={{ height: "200px" }}>
        <div className="h-full w-full rounded-xl bg-slate-200/50" />
      </div>

      {/* Button skeleton */}
      <div className="mb-6 flex justify-center">
        <div className="h-10 w-48 rounded-xl bg-slate-200/70 animate-pulse" />
      </div>

      {/* Match cards skeleton */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200">
            <div className="h-4 w-1/3 bg-slate-200/70 rounded mb-3" />
            <div className="flex items-center justify-between">
              <div className="h-5 w-24 bg-slate-200 rounded" />
              <div className="h-6 w-12 bg-slate-200/70 rounded" />
              <div className="h-5 w-24 bg-slate-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
