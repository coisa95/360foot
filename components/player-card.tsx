import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PlayerCardProps {
  slug: string;
  name: string;
  position: string;
  nationality: string;
  teamName?: string;
  age?: number;
}

const POSITION_LABELS: Record<string, string> = {
  Goalkeeper: "Gardien",
  Defender: "Défenseur",
  Midfielder: "Milieu",
  Attacker: "Attaquant",
};

export function PlayerCard({
  slug,
  name,
  position,
  nationality,
  teamName,
  age,
}: PlayerCardProps) {
  return (
    <Link href={`/joueur/${slug}`}>
      <Card className="border-dark-border bg-dark-card p-4 transition-colors hover:border-lime-500/30 hover:bg-dark-surface">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-white">{name}</h3>
            {teamName && (
              <p className="mt-0.5 text-sm text-gray-400">{teamName}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {nationality}
              {age && ` · ${age} ans`}
            </p>
          </div>
          <Badge
            variant="secondary"
            className="bg-lime-500/10 text-lime-400 text-xs"
          >
            {POSITION_LABELS[position] || position}
          </Badge>
        </div>
      </Card>
    </Link>
  );
}
