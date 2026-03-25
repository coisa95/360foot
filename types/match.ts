import type { Team } from "./team";
import type { League } from "./league";

export type MatchStatus = "NS" | "1H" | "HT" | "2H" | "FT" | "PST" | "CANC";

export interface Match {
  id: string;
  home_team_id: string;
  away_team_id: string;
  league_id: string;
  slug: string;
  date: string;
  status: MatchStatus;
  score_home: number | null;
  score_away: number | null;
  stats_json: MatchStats | null;
  events_json: MatchEvent[] | null;
  lineups_json: MatchLineups | null;
  api_football_id: number | null;
  created_at: string;
}

export interface MatchWithTeams extends Match {
  home_team: Team;
  away_team: Team;
}

export interface MatchWithTeamsAndLeague extends MatchWithTeams {
  league: League;
}

export interface MatchStats {
  home: TeamStats;
  away: TeamStats;
}

export interface TeamStats {
  shots_on_goal?: number;
  shots_off_goal?: number;
  total_shots?: number;
  blocked_shots?: number;
  corner_kicks?: number;
  offsides?: number;
  ball_possession?: string;
  fouls?: number;
  yellow_cards?: number;
  red_cards?: number;
  goalkeeper_saves?: number;
  total_passes?: number;
  passes_accurate?: number;
  expected_goals?: number;
  [key: string]: unknown;
}

export interface MatchEvent {
  time: number;
  extra_time?: number;
  team_id: string;
  player_name: string;
  assist_name?: string | null;
  type: "goal" | "card" | "subst" | "var";
  detail: string;
}

export interface MatchLineups {
  home: LineupData;
  away: LineupData;
}

export interface LineupData {
  formation: string;
  start_xi: LineupPlayer[];
  substitutes: LineupPlayer[];
}

export interface LineupPlayer {
  player_id: string;
  player_name: string;
  number: number;
  position: string;
}

export interface Player {
  id: string;
  name: string;
  slug: string;
  team_id: string;
  nationality: string | null;
  position: string | null;
  age: number | null;
  photo_url: string | null;
  stats_json: PlayerStats | null;
  api_football_id: number | null;
  created_at: string;
}

export interface PlayerStats {
  appearances?: number;
  goals?: number;
  assists?: number;
  yellow_cards?: number;
  red_cards?: number;
  minutes_played?: number;
  rating?: number;
  [key: string]: unknown;
}
