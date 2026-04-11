"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";

interface RoundNavProps {
  rounds: { raw: string; label: string; num: number; param: string }[];
  activeRound: string;
  slug: string;
  basePath?: string;
}

export function RoundNav({ rounds, activeRound, slug, basePath = "calendrier" }: RoundNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

  const scrollToActive = useCallback(() => {
    if (activeRef.current && containerRef.current) {
      const container = containerRef.current;
      const el = activeRef.current;
      const scrollLeft = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, []);

  // Scroll on mount and whenever activeRound changes
  useEffect(() => {
    // Small delay to ensure DOM is rendered
    const timer = setTimeout(scrollToActive, 100);
    return () => clearTimeout(timer);
  }, [activeRound, scrollToActive]);

  return (
    <nav aria-label="Navigation des journées" className="mb-4 -mx-4 px-4">
      <div
        ref={containerRef}
        className="flex gap-1.5 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
      >
        {rounds.map((round) => {
          const isActive = round.raw === activeRound;
          return (
            <Link
              rel="nofollow"
              key={round.raw}
              ref={isActive ? activeRef : null}
              href={`/ligue/${slug}/${basePath}?journee=${encodeURIComponent(round.param)}`}
              onClick={() => {
                // Scroll to clicked element after navigation
                setTimeout(() => {
                  if (containerRef.current) {
                    const target = containerRef.current.querySelector(`[data-round="${round.raw}"]`) as HTMLElement;
                    if (target) {
                      const container = containerRef.current!;
                      const scrollLeft = target.offsetLeft - container.offsetWidth / 2 + target.offsetWidth / 2;
                      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
                    }
                  }
                }, 200);
              }}
              data-round={round.raw}
              className={`inline-flex items-center justify-center min-w-[2.5rem] px-3 py-2 rounded-full text-xs font-semibold transition-all shrink-0 ${
                isActive
                  ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                  : "bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-emerald-500/30"
              }`}
            >
              {round.num > 0 ? `J${round.num}` : round.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
