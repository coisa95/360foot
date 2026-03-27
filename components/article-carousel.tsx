"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

const TYPE_LABELS: Record<string, string> = {
  result: "Résultat",
  preview: "Avant-match",
  transfer: "Transfert",
  recap: "Récap",
  player_profile: "Joueur",
};

const TYPE_COLORS: Record<string, string> = {
  result: "bg-blue-500/20 text-blue-400 border-blue-500/25",
  preview: "bg-orange-500/20 text-orange-400 border-orange-500/25",
  transfer: "bg-purple-500/20 text-purple-400 border-purple-500/25",
  recap: "bg-emerald-500/20 text-emerald-400 border-emerald-500/25",
  player_profile: "bg-cyan-500/20 text-cyan-400 border-cyan-500/25",
};

interface ArticleSlide {
  slug: string;
  title: string;
  excerpt: string;
  type: string;
  published_at: string;
  og_image_url?: string | null;
  league?: { name: string } | null;
}

export function ArticleCarousel({ articles }: { articles: ArticleSlide[] }) {
  const [current, setCurrent] = useState(0);
  const total = articles.length;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const resetAutoplay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, 6000);
  }, [total]);

  const goTo = useCallback((index: number) => {
    setCurrent(index);
    resetAutoplay();
  }, [resetAutoplay]);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % total);
    resetAutoplay();
  }, [total, resetAutoplay]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + total) % total);
    resetAutoplay();
  }, [total, resetAutoplay]);

  useEffect(() => {
    if (total <= 1) return;
    resetAutoplay();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [resetAutoplay, total]);

  if (total === 0) return null;

  return (
    <div className="relative">
      {/* Carousel container */}
      <div className="relative overflow-hidden rounded-xl md:rounded-2xl shadow-xl shadow-black/20" style={{ minHeight: "200px" }}>
        {articles.map((article, i) => {
          const typeColor = TYPE_COLORS[article.type] || "bg-lime-500/20 text-lime-400 border-lime-500/25";
          const typeLabel = TYPE_LABELS[article.type] || "Actu";
          const leagueName = article.league?.name || "";

          return (
            <Link
              key={article.slug}
              href={`/actu/${article.slug}`}
              className={`
                absolute inset-0 w-full h-full
                transition-opacity duration-700 ease-in-out
                ${i === current ? "opacity-100 z-10" : "opacity-0 z-0"}
              `}
            >
              {/* Mobile: overlay text on image | Desktop: side by side */}
              <div className="relative h-full md:grid md:grid-cols-2 bg-dark-card/90 border border-dark-border/50 rounded-xl md:rounded-2xl overflow-hidden backdrop-blur-sm">
                {/* Image */}
                <div className="relative h-[200px] md:h-auto md:min-h-[320px]">
                  <Image
                    src={article.og_image_url || `/api/og?title=${encodeURIComponent(article.title)}&type=${article.type}`}
                    alt={article.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  {/* Mobile: dark overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/70 to-transparent md:bg-gradient-to-r md:from-transparent md:to-dark-card/30" />
                </div>

                {/* Content — mobile: overlaid on image | desktop: side panel */}
                <div className="absolute bottom-0 left-0 right-0 p-3 md:relative md:flex md:flex-col md:justify-center md:p-8">
                  <div className="mb-1 md:mb-3 flex flex-wrap items-center gap-1.5 md:gap-2">
                    <span className={`rounded-md md:rounded-lg border px-2 py-0.5 text-[10px] md:text-[11px] font-semibold ${typeColor}`}>
                      {typeLabel}
                    </span>
                    {leagueName && (
                      <span className="text-[10px] md:text-xs text-gray-400">{leagueName}</span>
                    )}
                  </div>

                  <h2 className="mb-1 md:mb-3 text-sm md:text-2xl font-bold leading-tight text-white line-clamp-2 md:line-clamp-3">
                    {article.title}
                  </h2>

                  {article.excerpt && (
                    <p className="hidden md:block mb-4 line-clamp-2 text-sm text-gray-400">
                      {article.excerpt}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <time className="text-[10px] md:text-xs text-gray-500" dateTime={article.published_at}>
                      {new Date(article.published_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                    <span className="text-[10px] md:text-xs font-medium text-lime-400">
                      Lire →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Navigation arrows — visible on all screens */}
      {total > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); prev(); }}
            className="absolute left-2 md:left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-dark-bg/60 backdrop-blur-sm p-1.5 md:p-2 text-white/70 transition-all hover:bg-dark-bg/80 hover:text-white hover:scale-110 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400"
            aria-label="Précédent"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.preventDefault(); next(); }}
            className="absolute right-2 md:right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-dark-bg/60 backdrop-blur-sm p-1.5 md:p-2 text-white/70 transition-all hover:bg-dark-bg/80 hover:text-white hover:scale-110 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400"
            aria-label="Suivant"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots */}
      {total > 1 && (
        <div className="flex justify-center gap-1.5 md:gap-2 mt-2 md:mt-4">
          {articles.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-500 ${
                i === current
                  ? "w-5 md:w-8 h-1.5 md:h-2 bg-gradient-to-r from-lime-400 to-emerald-400 shadow-lg shadow-lime-500/30"
                  : "w-1.5 md:w-2 h-1.5 md:h-2 bg-gray-600 hover:bg-gray-500"
              }`}
              aria-label={`Article ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
