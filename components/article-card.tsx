import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ArticleCardProps {
  slug: string;
  title: string;
  excerpt: string;
  type: string;
  publishedAt: string;
  leagueName?: string;
}

const TYPE_LABELS: Record<string, string> = {
  result: "Résultat",
  preview: "Avant-match",
  transfer: "Transfert",
  player_profile: "Joueur",
  recap: "Récap",
  guide: "Guide",
  trending: "Tendance",
};

export function ArticleCard({
  slug,
  title,
  excerpt,
  type,
  publishedAt,
  leagueName,
}: ArticleCardProps) {
  const date = new Date(publishedAt);

  return (
    <Link href={`/actu/${slug}`}>
      <Card className="group border-dark-border bg-dark-card p-4 transition-all hover:border-lime-500/30 hover:bg-dark-surface">
        <div className="mb-2 flex items-center gap-2">
          <Badge
            variant="secondary"
            className="bg-lime-500/10 text-lime-400 text-xs"
          >
            {TYPE_LABELS[type] || type}
          </Badge>
          {leagueName && (
            <span className="text-xs text-gray-500">{leagueName}</span>
          )}
        </div>

        <h3 className="mb-2 text-base font-semibold leading-tight text-white transition-colors group-hover:text-lime-400">
          {title}
        </h3>

        <p className="mb-3 line-clamp-2 text-sm text-gray-400">{excerpt}</p>

        <time className="text-xs text-gray-500" dateTime={date.toISOString()}>
          {date.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </time>
      </Card>
    </Link>
  );
}
