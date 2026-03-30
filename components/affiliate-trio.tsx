"use client";

import Image from "next/image";

const BOOKMAKERS = [
  {
    name: "1xBet",
    slug: "1xbet",
    logo: "/images/bookmakers/1xbet.png",
    url: "https://reffpa.com/L?tag=d_689933m_1573c_bonus&site=689933&ad=1573",
    bonus: "200 000 FCFA",
    bonusLabel: "de bonus offerts",
    highlight: "Le plus populaire en Afrique",
    cta: "Récupérer mon bonus",
    color: "from-blue-600 to-blue-800",
    borderColor: "border-blue-500/30 hover:border-blue-400/60",
    btnColor: "bg-blue-500 hover:bg-blue-400",
    glowColor: "group-hover:shadow-blue-500/20",
    badge: "⭐ N°1",
    badgeBg: "bg-blue-500/20 text-blue-300",
  },
  {
    name: "Melbet",
    slug: "melbet",
    logo: "/images/bookmakers/melbet.png",
    url: "https://refpa3665.com/L?tag=d_4814359m_45415c_&site=4814359&ad=45415&r=registration",
    bonus: "100%",
    bonusLabel: "sur le 1er dépôt",
    highlight: "Double ton premier dépôt",
    cta: "Doubler mon dépôt",
    color: "from-amber-600 to-yellow-800",
    borderColor: "border-amber-500/30 hover:border-amber-400/60",
    btnColor: "bg-amber-500 hover:bg-amber-400",
    glowColor: "group-hover:shadow-amber-500/20",
    badge: "🔥 Populaire",
    badgeBg: "bg-amber-500/20 text-amber-300",
  },
  {
    name: "1win",
    slug: "1win",
    logo: "/images/bookmakers/1win.png",
    url: "https://1win.com/betting?p=1nye&sharebet=360foot&sub1=Foot360",
    bonus: "500%",
    bonusLabel: "de bonus de bienvenue",
    highlight: "Le plus gros bonus du marché",
    cta: "Profiter du 500%",
    color: "from-cyan-600 to-teal-800",
    borderColor: "border-cyan-500/30 hover:border-cyan-400/60",
    btnColor: "bg-cyan-500 hover:bg-cyan-400",
    glowColor: "group-hover:shadow-cyan-500/20",
    badge: "💰 Meilleur bonus",
    badgeBg: "bg-cyan-500/20 text-cyan-300",
  },
];

export function AffiliateTrio() {
  return (
    <div className="space-y-3 my-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-lime-400 text-center">
        🏆 Meilleurs bookmakers du moment
      </p>

      {/* Desktop: full cards */}
      <div className="hidden sm:grid sm:grid-cols-3 gap-3">
        {BOOKMAKERS.map((bk) => (
          <a
            key={bk.slug}
            href={bk.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={`group relative overflow-hidden rounded-xl border ${bk.borderColor} bg-gradient-to-br ${bk.color} p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${bk.glowColor}`}
          >
            {/* Badge */}
            <span className={`inline-flex items-center rounded-full ${bk.badgeBg} px-2 py-0.5 text-[10px] font-bold mb-3`}>
              {bk.badge}
            </span>

            {/* Logo */}
            <div className="mb-3">
              <Image
                src={bk.logo}
                alt={`Logo ${bk.name}`}
                width={120}
                height={48}
                className="h-10 w-auto object-contain"

              />
            </div>

            {/* Bonus amount */}
            <div className="mb-1">
              <span className="text-2xl font-black text-white">{bk.bonus}</span>
              <p className="text-xs text-white/70">{bk.bonusLabel}</p>
            </div>

            {/* Highlight */}
            <p className="text-[11px] text-white/60 mb-3">{bk.highlight}</p>

            {/* CTA */}
            <div className={`w-full text-center rounded-lg ${bk.btnColor} px-4 py-2 text-xs font-bold text-dark-bg transition-all group-hover:shadow-md`}>
              {bk.cta} →
            </div>
          </a>
        ))}
      </div>

      {/* Mobile: cards with logo */}
      <div className="sm:hidden space-y-2">
        {BOOKMAKERS.map((bk) => (
          <a
            key={bk.slug}
            href={bk.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={`group flex items-center gap-3 rounded-xl border ${bk.borderColor} bg-gradient-to-r ${bk.color} px-3 py-2.5 transition-all`}
          >
            {/* Logo */}
            <Image
              src={bk.logo}
              alt={`Logo ${bk.name}`}
              width={80}
              height={32}
              className="h-8 w-auto object-contain shrink-0"
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black text-white">{bk.bonus}</span>
                <span className="text-[10px] text-white/70">{bk.bonusLabel}</span>
              </div>
              <p className="text-[10px] text-white/50 truncate">{bk.highlight}</p>
            </div>

            {/* CTA */}
            <span className={`shrink-0 rounded-lg ${bk.btnColor} px-3 py-1.5 text-[10px] font-bold text-dark-bg`}>
              Profiter
            </span>
          </a>
        ))}
      </div>

      <p className="text-center text-[10px] text-gray-500">
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
      className={`group my-4 flex items-center gap-3 rounded-xl border ${bk.borderColor} bg-gradient-to-r ${bk.color} p-3 transition-all hover:shadow-lg ${bk.glowColor}`}
    >
      <Image
        src={bk.logo}
        alt={`Logo ${bk.name}`}
        width={80}
        height={32}
        className="h-8 w-auto object-contain shrink-0"
      />
      <div className="flex-1">
        <span className="font-black text-white">{bk.bonus}</span>
        <span className="ml-1.5 text-sm text-white/80">{bk.bonusLabel}</span>
      </div>
      <span className={`rounded-lg ${bk.btnColor} px-3 py-1.5 text-xs font-bold text-dark-bg transition-all`}>
        {bk.cta} →
      </span>
    </a>
  );
}
