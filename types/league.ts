export interface League {
  id: string;
  name: string;
  slug: string;
  country: string;
  country_code: string;
  logo_url: string | null;
  tier: number;
  api_football_id: number | null;
  created_at: string;
}

export interface LeagueWithStandings extends League {
  standings: Standing[];
}

export interface Standing {
  id: string;
  league_id: string;
  season: string;
  data_json: StandingEntry[];
  updated_at: string;
}

export interface StandingEntry {
  rank: number;
  team_id: string;
  team_name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  form?: string;
}
