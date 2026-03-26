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
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % SLIDES.length);
        setIsVisible(true);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const slide = SLIDES[current];

  return (
    <div className="py-2 px-4 mx-auto max-w-7xl">
      <a
        href={slide.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className={`
          block w-full rounded-xl bg-gradient-to-r ${slide.bg}
          px-4 py-2.5 shadow-lg ${slide.glow}
          transition-all duration-300 ease-in-out
          hover:scale-[1.01] hover:shadow-xl
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">{slide.icon}</span>
            <div>
              <span className="text-white font-bold text-sm">{slide.name}</span>
              <span className="text-white/80 text-sm ml-2 hidden sm:inline">— {slide.text}</span>
              <span className="text-white/80 text-xs ml-2 sm:hidden">{slide.text}</span>
            </div>
          </div>
          <span className="flex items-center gap-1 rounded-lg bg-white/20 backdrop-blur-sm px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-white/30">
            Profiter
            <svg className="w-3.5 h-3.5 animate-bounce-x" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-1.5 mt-1.5">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === current ? "w-4 bg-white" : "w-1.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      </a>

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
