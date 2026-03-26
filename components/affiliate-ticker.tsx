"use client";

import { useState, useEffect } from "react";

const SLIDES = [
  {
    text: "🔥 1xBet — Bonus de bienvenue jusqu'à 200 000 FCFA",
    url: "https://reffpa.com/L?tag=d_689933m_1573c_bonus&site=689933&ad=1573",
    bg: "from-blue-900/80 to-blue-700/80",
  },
  {
    text: "⚡ Melbet — Bonus 100% sur ton 1er dépôt",
    url: "https://refpa3665.com/L?tag=d_4814359m_45415c_&site=4814359&ad=45415&r=registration",
    bg: "from-yellow-900/80 to-yellow-700/80",
  },
  {
    text: "🎯 1win — Bonus de bienvenue jusqu'à 500%",
    url: "https://1win.com/betting?p=1nye&sharebet=360foot&sub1=Foot360",
    bg: "from-cyan-900/80 to-cyan-700/80",
  },
];

export function AffiliateTicker() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const slide = SLIDES[current];

  return (
    <a
      href={slide.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={`block w-full bg-gradient-to-r ${slide.bg} border-b border-dark-border py-2 transition-all duration-500`}
    >
      <div className="mx-auto max-w-7xl px-4 flex items-center justify-between">
        <p className="text-sm font-medium text-white transition-opacity duration-500 animate-fade-in">
          {slide.text}
        </p>
        <span className="hidden sm:inline-block rounded bg-white/20 px-3 py-0.5 text-xs font-semibold text-white">
          S&apos;inscrire →
        </span>
      </div>
    </a>
  );
}
