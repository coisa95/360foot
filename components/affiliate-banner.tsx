"use client";

interface AffiliateBannerProps {
  bookmakerName: string;
  affiliateUrl: string;
  bonus: string;
}

export function AffiliateBanner({
  bookmakerName,
  affiliateUrl,
  bonus,
}: AffiliateBannerProps) {
  return (
    <div className="rounded-lg border border-lime-500/20 bg-gradient-to-r from-dark-card to-lime-900/10 p-4">
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-lime-400">
            Bookmaker du mois
          </p>
          <p className="mt-1 text-sm text-gray-300">
            {bonus} avec <span className="font-semibold text-white">{bookmakerName}</span>
          </p>
        </div>
        <a
          href={affiliateUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="rounded-lg bg-lime-500 px-5 py-2 text-sm font-semibold text-dark-bg transition-colors hover:bg-lime-400"
        >
          Profiter du bonus
        </a>
      </div>
      <p className="mt-2 text-center text-[10px] text-gray-600 sm:text-left">
        18+ | Jouer comporte des risques. Conditions sur le site du bookmaker.
      </p>
    </div>
  );
}
