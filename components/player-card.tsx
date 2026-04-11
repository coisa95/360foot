import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PlayerCardProps {
  slug: string;
  name: string;
  position: string;
  nationality: string;
  teamName?: string;
  age?: number;
  number?: number | null;
  photoUrl?: string | null;
}

const POSITION_LABELS: Record<string, string> = {
  Goalkeeper: "Gardien",
  Defender: "Défenseur",
  Midfielder: "Milieu",
  Attacker: "Attaquant",
};

const POSITION_COLORS: Record<string, string> = {
  Goalkeeper: "bg-yellow-50 text-yellow-700",
  Defender: "bg-blue-50 text-blue-700",
  Midfielder: "bg-emerald-50 text-emerald-700",
  Attacker: "bg-red-50 text-red-700",
};

export function PlayerCard({
  slug,
  name,
  position,
  nationality,
  teamName,
  age,
  number,
  photoUrl,
}: PlayerCardProps) {
  return (
    <Link href={`/joueur/${slug}`}>
      <Card className="border-slate-200/80 bg-white/80 backdrop-blur-sm p-4 transition-colors hover:border-emerald-500/30 hover:bg-slate-50">
        <div className="flex items-center gap-3">
          {/* Player photo */}
          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full bg-slate-100">
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt={name}
                width={56}
                height={56}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-bold text-slate-400">
                {number ?? "?"}
              </div>
            )}
          </div>

          {/* Player info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {number != null && (
                <span className="text-sm font-bold text-emerald-600">#{number}</span>
              )}
              <h3 className="font-display truncate font-semibold text-slate-900">{name}</h3>
            </div>
            {teamName && (
              <p className="mt-0.5 truncate text-sm text-slate-500">{teamName}</p>
            )}
            <p className="mt-0.5 text-xs text-slate-400">
              {nationality}
              {age != null && ` · ${age} ans`}
            </p>
          </div>

          {/* Position badge */}
          <Badge
            variant="secondary"
            className={`flex-shrink-0 text-xs ${POSITION_COLORS[position] || "bg-emerald-50 text-emerald-700"}`}
          >
            {POSITION_LABELS[position] || position}
          </Badge>
        </div>
      </Card>
    </Link>
  );
}
