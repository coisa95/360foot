export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Hero skeleton */}
      <div className="mb-4 md:mb-10 rounded-xl md:rounded-2xl bg-dark-card/50 px-4 py-3 md:p-6 animate-pulse">
        <div className="h-6 md:h-10 w-3/4 bg-dark-border/50 rounded-lg" />
        <div className="mt-2 h-4 w-1/2 bg-dark-border/30 rounded-lg hidden sm:block" />
      </div>

      {/* Carousel skeleton */}
      <div className="mb-4 md:mb-8 rounded-xl md:rounded-2xl bg-dark-card/50 animate-pulse" style={{ height: "200px" }}>
        <div className="h-full w-full rounded-xl bg-dark-border/20" />
      </div>

      {/* Button skeleton */}
      <div className="mb-6 flex justify-center">
        <div className="h-10 w-48 rounded-xl bg-dark-border/30 animate-pulse" />
      </div>

      {/* Match cards skeleton */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/[0.06]">
            <div className="h-4 w-1/3 bg-dark-border/30 rounded mb-3" />
            <div className="flex items-center justify-between">
              <div className="h-5 w-24 bg-dark-border/40 rounded" />
              <div className="h-6 w-12 bg-dark-border/30 rounded" />
              <div className="h-5 w-24 bg-dark-border/40 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
