"use client";

const BOOKMAKERS = [
  {
    name: "1xBet",
    slug: "1xbet",
    url: "https://reffpa.com/L?tag=d_689933m_1573c_bonus&site=689933&ad=1573",
    bonus: "Bonus jusqu'à 200 000 FCFA",
    color: "from-blue-600 to-blue-800",
    textColor: "text-blue-400",
    btnColor: "bg-blue-500 hover:bg-blue-400",
  },
  {
    name: "Melbet",
    slug: "melbet",
    url: "https://refpa3665.com/L?tag=d_4814359m_45415c_&site=4814359&ad=45415&r=registration",
    bonus: "Bonus 100% 1er dépôt",
    color: "from-yellow-600 to-yellow-800",
    textColor: "text-yellow-400",
    btnColor: "bg-yellow-500 hover:bg-yellow-400",
  },
  {
    name: "1win",
    slug: "1win",
    url: "https://1win.com/betting?p=1nye&sharebet=360foot&sub1=Foot360",
    bonus: "Bonus jusqu'à 500%",
    color: "from-cyan-600 to-cyan-800",
    textColor: "text-cyan-400",
    btnColor: "bg-cyan-500 hover:bg-cyan-400",
  },
];

export function AffiliateTrio() {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-lime-400 text-center">
        Nos partenaires
      </p>
      {/* Compact row on mobile, full cards on desktop */}
      <div className="hidden sm:grid sm:grid-cols-3 gap-3">
        {BOOKMAKERS.map((bk) => (
          <a
            key={bk.slug}
            href={bk.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={`group relative overflow-hidden rounded-lg border border-gray-700/50 bg-gradient-to-br ${bk.color} p-4 transition-all hover:scale-[1.02] hover:border-lime-500/30`}
          >
            <div className="relative z-10">
              <p className="text-lg font-bold text-white">{bk.name}</p>
              <p className="mt-1 text-sm text-white/80">{bk.bonus}</p>
              <div
                className={`mt-3 inline-block rounded-md ${bk.btnColor} px-4 py-1.5 text-xs font-semibold text-dark-bg transition-colors`}
              >
                S&apos;inscrire
              </div>
            </div>
          </a>
        ))}
      </div>
      {/* Mobile: compact inline rows */}
      <div className="sm:hidden space-y-2">
        {BOOKMAKERS.map((bk) => (
          <a
            key={bk.slug}
            href={bk.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={`flex items-center justify-between rounded-lg border border-gray-700/50 bg-gradient-to-r ${bk.color} px-3 py-2 transition-all`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{bk.name}</span>
              <span className="text-xs text-white/80">{bk.bonus}</span>
            </div>
            <span
              className={`rounded-md ${bk.btnColor} px-3 py-1 text-[10px] font-semibold text-dark-bg`}
            >
              S&apos;inscrire
            </span>
          </a>
        ))}
      </div>
      <p className="text-center text-[10px] text-gray-600">
        18+ | Jouer comporte des risques. Conditions sur le site du bookmaker.
      </p>
    </div>
  );
}

// Single bookmaker card for inline placement in articles
export function AffiliateInline({ index = 0 }: { index?: number }) {
  const bk = BOOKMAKERS[index % BOOKMAKERS.length];
  return (
    <a
      href={bk.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={`my-4 flex items-center justify-between rounded-lg border border-gray-700/50 bg-gradient-to-r ${bk.color} p-3 transition-all hover:border-lime-500/30`}
    >
      <div>
        <span className="font-bold text-white">{bk.name}</span>
        <span className="ml-2 text-sm text-white/80">— {bk.bonus}</span>
      </div>
      <span
        className={`rounded-md ${bk.btnColor} px-3 py-1 text-xs font-semibold text-dark-bg`}
      >
        Profiter
      </span>
    </a>
  );
}
