"use client";

import { useState, useEffect } from "react";

const SLIDES = [
  {
    text: "Bonus de bienvenue jusqu'à 200 000 FCFA",
    name: "1xBet",
    url: "https://reffpa.com/L?tag=d_689933m_1573c_bonus&site=689933&ad=1573",
    bg: "from-blue-600 to-blue-800",
    glow: "shadow-blue-500/30",
    icon: "🔥",
  },
  {
    text: "Bonus 100% sur ton 1er dépôt",
    name: "Melbet",
    url: "https://refpa3665.com/L?tag=d_4814359m_45415c_&site=4814359&ad=45415&r=registration",
    bg: "from-amber-500 to-orange-700",
    glow: "shadow-amber-500/30",
    icon: "⚡",
  },
  {
    text: "Bonus de bienvenue jusqu'à 500%",
    name: "1win",
    url: "https://1win.com/betting?p=1nye&sharebet=360foot&sub1=Foot360",
    bg: "from-cyan-500 to-teal-700",
    glow: "shadow-cyan-500/30",
    icon: "🎯",
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

  return (
    <div className="py-2 px-4 mx-auto max-w-7xl">
      <div className="relative h-[72px] sm:h-[56px] rounded-xl overflow-hidden shadow-lg">
        {/* All slides stacked, opacity controls visibility */}
        {SLIDES.map((slide, i) => (
          <a
            key={i}
            href={slide.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={`
              absolute inset-0 w-full h-full
              bg-gradient-to-r ${slide.bg}
              px-4 py-2.5 flex items-center
              transition-opacity duration-700 ease-in-out
              ${i === current ? "opacity-100 z-10" : "opacity-0 z-0"}
            `}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <span className="text-lg">{slide.icon}</span>
                <div>
                  <span className="text-white font-bold text-sm">{slide.name}</span>
                  <span className="text-white/80 text-sm ml-2 hidden sm:inline">— {slide.text}</span>
                  <p className="text-white/80 text-[11px] leading-tight sm:hidden mt-0.5">{slide.text}</p>
                </div>
              </div>
              <span className="flex items-center gap-1 rounded-lg bg-white/20 backdrop-blur-sm px-3 py-1.5 text-xs font-bold text-white">
                Profiter
                <svg className="w-3.5 h-3.5 animate-bounce-x" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </div>
          </a>
        ))}

        {/* Dots indicator - on top of everything */}
        <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1.5 z-20">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.preventDefault(); setCurrent(i); }}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === current ? "w-4 bg-white" : "w-1.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(4px); }
        }
        .animate-bounce-x {
          animation: bounce-x 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
