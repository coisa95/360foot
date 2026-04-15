import Link from "next/link";
import Image from "next/image";
import { getArticleTypeLabel, getArticleTypeColor } from "@/lib/article-types";

interface ArticleCardProps {
  slug: string;
  title: string;
  excerpt: string;
  type: string;
  publishedAt: string;
  leagueName?: string;
  imageUrl?: string | null;
}

// Type labels and colors from shared utility (lib/article-types.ts)

export function ArticleCard({
  slug,
  title,
  excerpt,
  type,
  publishedAt,
  imageUrl,
}: ArticleCardProps) {
  const date = new Date(publishedAt);
  const typeConf = { label: getArticleTypeLabel(type), color: getArticleTypeColor(type) };

  return (
    <Link href={`/actu/${slug}`} className="group block">
      <div className="h-full rounded-xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-0.5 overflow-hidden">
        {/* Image */}
        {imageUrl && (
          <div className="relative w-full aspect-[16/9] overflow-hidden bg-slate-100">
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"

            />
          </div>
        )}

        <div className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-semibold ${typeConf.color}`}>
              {typeConf.label}
            </span>
          </div>

          <h3 className="font-display mb-2 text-base font-semibold leading-tight text-slate-900 transition-colors group-hover:bg-gradient-to-r group-hover:from-emerald-600 group-hover:to-emerald-600 group-hover:bg-clip-text group-hover:text-transparent">
            {title}
          </h3>

          <p className="mb-3 line-clamp-2 text-sm text-slate-500">{excerpt}</p>

          <div className="flex items-center justify-between">
            <time className="text-[11px] text-slate-400" dateTime={date.toISOString()}>
              {date.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
            <span className="text-[11px] text-emerald-600/0 transition-all group-hover:text-emerald-600/80">
              Lire →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
