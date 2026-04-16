export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-4 md:py-8 space-y-6 md:space-y-10">
      {/* Hero skeleton */}
      <div className="rounded-2xl md:rounded-3xl border border-slate-200 bg-white/50 p-5 md:p-10 animate-pulse">
        <div className="h-6 md:h-10 w-3/4 bg-slate-200 rounded-lg" />
        <div className="mt-2 md:mt-4 h-4 w-1/2 bg-slate-200/70 rounded-lg" />
        <div className="mt-3 md:mt-6 flex gap-2 md:gap-3">
          <div className="h-8 md:h-10 w-32 rounded-full bg-emerald-200/50" />
          <div className="h-8 md:h-10 w-24 rounded-full bg-blue-200/50" />
        </div>
      </div>

      {/* Section header skeleton */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-6 rounded-full bg-slate-200" />
        <div className="h-5 w-24 bg-slate-200 rounded-lg" />
      </div>

      {/* Carousel skeleton */}
      <div className="rounded-xl md:rounded-2xl bg-slate-100 animate-pulse aspect-[16/9] md:aspect-[2.5/1]">
        <div className="h-full w-full rounded-xl bg-slate-200/50" />
      </div>

      {/* Matchs du jour skeleton */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-6 rounded-full bg-blue-200" />
          <div className="h-5 w-32 bg-slate-200 rounded-lg" />
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white/80 px-3.5 py-3 animate-pulse">
              <div className="h-3 w-1/3 bg-slate-200/70 rounded mb-2" />
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-200" />
                    <div className="h-4 w-24 bg-slate-200 rounded" />
                  </div>
                  <div className="h-4 w-6 bg-slate-200/70 rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-200" />
                    <div className="h-4 w-20 bg-slate-200 rounded" />
                  </div>
                  <div className="h-4 w-6 bg-slate-200/70 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Articles + Classements skeleton */}
      <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white/80 overflow-hidden animate-pulse">
                <div className="aspect-[16/9] bg-slate-200" />
                <div className="p-4 space-y-2">
                  <div className="h-3 w-16 bg-slate-200 rounded" />
                  <div className="h-4 w-full bg-slate-200 rounded" />
                  <div className="h-4 w-3/4 bg-slate-200/70 rounded" />
                  <div className="h-3 w-1/3 bg-slate-200/50 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <aside className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-white/80 overflow-hidden animate-pulse">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="h-3 w-32 bg-slate-200 rounded" />
              </div>
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center gap-2 px-3 py-1.5">
                  <div className="w-4 h-3 bg-slate-200/70 rounded" />
                  <div className="w-3.5 h-3.5 rounded bg-slate-200" />
                  <div className="h-3 flex-1 bg-slate-200 rounded" />
                  <div className="w-5 h-3 bg-slate-200/70 rounded" />
                </div>
              ))}
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
