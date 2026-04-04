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
  Goalkeeper: "bg-yellow-500/10 text-yellow-400",
  Defender: "bg-blue-500/10 text-blue-400",
  Midfielder: "bg-emerald-500/10 text-emerald-400",
  Attacker: "bg-red-500/10 text-red-400",
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
      <Card className="border-white/[0.06] bg-dark-card p-4 transition-colors hover:border-emerald-500/30 hover:bg-white/[0.02]">
        <div className="flex items-center gap-3">
          {/* Player photo */}
          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full bg-white/[0.02]">
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt={name}
                width={56}
                height={56}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-bold text-gray-600">
                {number ?? "?"}
              </div>
            )}
          </div>

          {/* Player info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {number != null && (
                <span className="text-sm font-bold text-emerald-400">#{number}</span>
              )}
              <h3 className="font-display truncate font-semibold text-white">{name}</h3>
            </div>
            {teamName && (
              <p className="mt-0.5 truncate text-sm text-gray-400">{teamName}</p>
            )}
            <p className="mt-0.5 text-xs text-gray-500">
              {nationality}
              {age != null && ` · ${age} ans`}
            </p>
          </div>

          {/* Position badge */}
          <Badge
            variant="secondary"
            className={`flex-shrink-0 text-xs ${POSITION_COLORS[position] || "bg-emerald-500/10 text-emerald-400"}`}
          >
            {POSITION_LABELS[position] || position}
          </Badge>
        </div>
      </Card>
    </Link>
  );
}
