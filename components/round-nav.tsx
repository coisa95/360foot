"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

interface RoundNavProps {
  rounds: { raw: string; label: string; num: number; param: string }[];
  activeRound: string;
  slug: string;
}

export function RoundNav({ rounds, activeRound, slug }: RoundNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      const container = containerRef.current;
      const el = activeRef.current;
      const scrollLeft = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [activeRound]);

  return (
    <div className="mb-4 -mx-4 px-4">
      <div
        ref={containerRef}
        className="flex gap-1.5 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
      >
        {rounds.map((round) => {
          const isActive = round.raw === activeRound;
          return (
            <Link
              key={round.raw}
              ref={isActive ? activeRef : null}
              href={`/ligue/${slug}/calendrier?journee=${encodeURIComponent(round.param)}`}
              className={`inline-flex items-center justify-center min-w-[2.5rem] px-3 py-2 rounded-full text-xs font-semibold transition-all shrink-0 ${
                isActive
                  ? "bg-lime-400 text-black shadow-md shadow-lime-500/20"
                  : "bg-dark-card border border-dark-border/50 text-gray-400 hover:text-white hover:border-lime-500/30"
              }`}
            >
              {round.num > 0 ? `J${round.num}` : round.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
