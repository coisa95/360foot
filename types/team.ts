import type { League } from "./league";
import type { Player } from "./match";

export interface Team {
  id: string;
  name: string;
  slug: string;
  league_id: string;
  logo_url: string | null;
  country: string;
  venue: string | null;
  coach: string | null;
  api_football_id: number | null;
  created_at: string;
}

export interface TeamWithLeague extends Team {
  league: League;
}

export interface TeamWithPlayers extends Team {
  players: Player[];
}

export interface TeamWithLeagueAndPlayers extends Team {
  league: League;
  players: Player[];
}
