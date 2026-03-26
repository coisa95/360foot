"use client";

const TICKER_ITEMS = [
  {
    text: "🔥 1xBet — Bonus jusqu'à 200 000 FCFA",
    url: "https://reffpa.com/L?tag=d_689933m_1573c_bonus&site=689933&ad=1573",
    color: "text-blue-400",
  },
  {
    text: "⚡ Melbet — Bonus 100% sur le 1er dépôt",
    url: "https://refpa3665.com/L?tag=d_4814359m_45415c_&site=4814359&ad=45415&r=registration",
    color: "text-yellow-400",
  },
  {
    text: "🎯 1win — Bonus de bienvenue jusqu'à 500%",
    url: "https://1win.com/betting?p=1nye&sharebet=360foot&sub1=Foot360",
    color: "text-cyan-400",
  },
  {
    text: "🔥 1xBet — Inscris-toi et profite du meilleur bonus",
    url: "https://reffpa.com/L?tag=d_689933m_1573c_bonus&site=689933&ad=1573",
    color: "text-blue-400",
  },
  {
    text: "⚡ Melbet — Paris sportifs avec les meilleures cotes",
    url: "https://refpa3665.com/L?tag=d_4814359m_45415c_&site=4814359&ad=45415&r=registration",
    color: "text-yellow-400",
  },
  {
    text: "🎯 1win — Le bookmaker qui offre le plus gros bonus",
    url: "https://1win.com/betting?p=1nye&sharebet=360foot&sub1=Foot360",
    color: "text-cyan-400",
  },
];

export function AffiliateTicker() {
  return (
    <div className="relative overflow-hidden bg-dark-card/80 border-b border-dark-border py-2">
      <div className="ticker-wrap">
        <div className="ticker-move flex gap-12">
          {/* Double the items for seamless loop */}
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className={`ticker-item flex-shrink-0 text-sm font-medium transition-opacity hover:opacity-80 ${item.color}`}
            >
              {item.text}
            </a>
          ))}
        </div>
      </div>

      <style jsx>{`
        .ticker-wrap {
          width: 100%;
          overflow: hidden;
        }
        .ticker-move {
          animation: ticker 30s linear infinite;
          white-space: nowrap;
        }
        .ticker-move:hover {
          animation-play-state: paused;
        }
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
