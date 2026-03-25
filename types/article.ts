import type { Match, MatchWithTeamsAndLeague } from "./match";
import type { League } from "./league";
import type { Team } from "./team";

export type ArticleType =
  | "result"
  | "preview"
  | "transfer"
  | "player_profile"
  | "recap"
  | "guide"
  | "trending";

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  type: ArticleType;
  match_id: string | null;
  league_id: string | null;
  team_id: string | null;
  player_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  tags: string[];
  published_at: string | null;
  created_at: string;
}

export interface ArticleWithRelations extends Article {
  match?: MatchWithTeamsAndLeague | null;
  league?: League | null;
  team?: Team | null;
}

export interface Transfer {
  id: string;
  player_name: string;
  player_id: string | null;
  from_team: string;
  to_team: string;
  fee: string | null;
  transfer_type: "transfer" | "loan" | "free" | "rumor";
  date: string;
  article_id: string | null;
  created_at: string;
}

export interface TransferWithArticle extends Transfer {
  article?: Article | null;
}
