"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const SLIDES = [
  {
    name: "1xBet",
    logo: "/images/bookmakers/1xbet.png",
    text: "200 000 FCFA de bonus offerts",
    shortText: "200 000 FCFA offerts",
    url: "https://reffpa.com/L?tag=d_689933m_1573c_bonus&site=689933&ad=1573",
    bg: "from-blue-600 to-blue-800",
    cta: "Récupérer",
  },
  {
    name: "Melbet",
    logo: "/images/bookmakers/melbet.png",
    text: "Double ton 1er dépôt — Bonus 100%",
    shortText: "Bonus 100% 1er dépôt",
    url: "https://refpa3665.com/L?tag=d_4814359m_45415c_&site=4814359&ad=45415&r=registration",
    bg: "from-amber-500 to-orange-700",
    cta: "Profiter",
  },
  {
    name: "1win",
    logo: "/images/bookmakers/1win.png",
    text: "Le plus gros bonus : jusqu'à 500%",
    shortText: "Bonus jusqu'à 500%",
    url: "https://1win.com/betting?p=1nye&sharebet=360foot&sub1=Foot360",
    bg: "from-cyan-500 to-teal-700",
    cta: "Foncer",
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
                {/* Logo */}
                <Image
                  src={slide.logo}
                  alt={`Logo ${slide.name}`}
                  width={80}
                  height={32}
                  className="h-7 sm:h-8 w-auto object-contain shrink-0"
                  unoptimized
                />

                {/* Separator */}
                <div className="w-px h-6 bg-white/20 shrink-0" />

                {/* Text */}
                <div>
                  <span className="text-white/90 text-sm font-semibold hidden sm:inline">{slide.text}</span>
                  <p className="text-white/90 text-[12px] font-semibold leading-tight sm:hidden">{slide.shortText}</p>
                </div>
              </div>

              {/* CTA */}
              <span className="flex items-center gap-1 rounded-lg bg-white/20 backdrop-blur-sm px-3 py-1.5 text-xs font-bold text-white shrink-0">
                {slide.cta}
                <svg className="w-3.5 h-3.5 animate-bounce-x" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </div>
          </a>
        ))}

        {/* Dots */}
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
