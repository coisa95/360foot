"use client";

interface AffiliateButtonProps {
  bookmakerName: string;
  affiliateUrl: string;
  bonus: string;
  articleId?: string;
  className?: string;
}

export function AffiliateButton({
  bookmakerName,
  affiliateUrl,
  bonus,
  articleId,
  className = "",
}: AffiliateButtonProps) {
  const handleClick = () => {
    fetch("/api/track-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookmaker_name: bookmakerName,
        article_id: articleId,
        page_url: window.location.pathname,
      }),
    }).catch(() => {});
  };

  return (
    <a
      href={affiliateUrl}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={handleClick}
      className={`inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-lime-600 to-lime-500 px-4 py-2.5 text-sm font-semibold text-dark-bg transition-all hover:from-lime-500 hover:to-lime-400 hover:shadow-lg hover:shadow-lime-500/20 ${className}`}
    >
      <span>Parier sur {bookmakerName}</span>
      <span className="rounded bg-dark-bg/20 px-2 py-0.5 text-xs">{bonus}</span>
    </a>
  );
}
