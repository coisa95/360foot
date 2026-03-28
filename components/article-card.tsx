import Link from "next/link";
import Image from "next/image";

interface ArticleCardProps {
  slug: string;
  title: string;
  excerpt: string;
  type: string;
  publishedAt: string;
  leagueName?: string;
  imageUrl?: string | null;
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  result: { label: "Résultat", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  preview: { label: "Avant-match", color: "bg-orange-500/15 text-orange-400 border-orange-500/20" },
  transfer: { label: "Transfert", color: "bg-purple-500/15 text-purple-400 border-purple-500/20" },
  player_profile: { label: "Joueur", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20" },
  recap: { label: "Récap", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  guide: { label: "Guide", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" },
  trending: { label: "Tendance", color: "bg-pink-500/15 text-pink-400 border-pink-500/20" },
};

export function ArticleCard({
  slug,
  title,
  excerpt,
  type,
  publishedAt,
  leagueName,
  imageUrl,
}: ArticleCardProps) {
  const date = new Date(publishedAt);
  const typeConf = TYPE_CONFIG[type] || { label: type, color: "bg-lime-500/15 text-lime-400 border-lime-500/20" };

  return (
    <Link href={`/actu/${slug}`} className="group block">
      <div className="h-full rounded-xl border border-dark-border/50 bg-dark-card/80 shadow-lg shadow-black/10 backdrop-blur-sm transition-all duration-300 hover:border-lime-500/20 hover:shadow-xl hover:shadow-lime-500/5 hover:-translate-y-0.5 overflow-hidden">
        {/* Image */}
        {imageUrl && (
          <div className="relative w-full aspect-[16/9] overflow-hidden bg-dark-surface">
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              unoptimized
            />
          </div>
        )}

        <div className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-semibold ${typeConf.color}`}>
              {typeConf.label}
            </span>
            {leagueName && (
              <span className="text-[11px] text-gray-500">{leagueName}</span>
            )}
          </div>

          <h3 className="mb-2 text-base font-semibold leading-tight text-gray-100 transition-colors group-hover:bg-gradient-to-r group-hover:from-lime-400 group-hover:to-emerald-400 group-hover:bg-clip-text group-hover:text-transparent">
            {title}
          </h3>

          <p className="mb-3 line-clamp-2 text-sm text-gray-400/80">{excerpt}</p>

          <div className="flex items-center justify-between">
            <time className="text-[11px] text-gray-500" dateTime={date.toISOString()}>
              {date.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
            <span className="text-[11px] text-lime-500/0 transition-all group-hover:text-lime-500/80">
              Lire →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
