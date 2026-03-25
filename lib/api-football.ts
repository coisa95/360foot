const BASE_URL = "https://v3.football.api-sports.io";

interface ApiResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: Record<string, string> | string[];
  results: number;
  paging: { current: number; total: number };
  response: T;
}

interface MatchFixture {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    venue: { id: number; name: string; city: string };
    status: { long: string; short: string; elapsed: number | null };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    round: string;
  };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}

interface MatchDetails extends MatchFixture {
  events: {
    time: { elapsed: number; extra: number | null };
    team: { id: number; name: string; logo: string };
    player: { id: number; name: string };
    assist: { id: number | null; name: string | null };
    type: string;
    detail: string;
    comments: string | null;
  }[];
  lineups: {
    team: { id: number; name: string; logo: string };
    formation: string;
    startXI: { player: { id: number; name: string; number: number; pos: string } }[];
    substitutes: { player: { id: number; name: string; number: number; pos: string } }[];
    coach: { id: number; name: string; photo: string };
  }[];
  statistics: {
    team: { id: number; name: string; logo: string };
    statistics: { type: string; value: number | string | null }[];
  }[];
}

interface Standing {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  group: string;
  form: string;
  status: string;
  description: string | null;
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
  home: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
  away: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
}

interface StandingsResponse {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
    standings: Standing[][];
  };
}

interface SquadPlayer {
  id: number;
  name: string;
  age: number;
  number: number | null;
  position: string;
  photo: string;
}

interface SquadResponse {
  team: { id: number; name: string; logo: string };
  players: SquadPlayer[];
}

interface PlayerStatistics {
  player: {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number;
    nationality: string;
    height: string;
    weight: string;
    photo: string;
  };
  statistics: {
    team: { id: number; name: string; logo: string };
    league: { id: number; name: string; country: string; logo: string; flag: string; season: number };
    games: { appearances: number; lineups: number; minutes: number; position: string; rating: string | null };
    goals: { total: number | null; assists: number | null; conceded: number | null; saves: number | null };
    shots: { total: number | null; on: number | null };
    passes: { total: number | null; key: number | null; accuracy: number | null };
    cards: { yellow: number; yellowred: number; red: number };
  }[];
}

async function fetchApi<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "x-apisports-key": process.env.API_FOOTBALL_KEY!,
    },
  });

  if (!response.ok) {
    throw new Error(`API-Football error: ${response.status} ${response.statusText}`);
  }

  const data: ApiResponse<T> = await response.json();

  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(`API-Football errors: ${JSON.stringify(data.errors)}`);
  }

  return data.response;
}

/**
 * Map of league ID → current season year.
 * Updated based on API-Football data (March 2026).
 */
const LEAGUE_SEASONS: Record<number, number> = {
  // Ligues africaines
  386: 2025, // Ligue 1 Côte d'Ivoire
  403: 2025, // Ligue 1 Sénégal
  411: 2025, // Elite One Cameroun
  598: 2025, // Première Division Mali
  423: 2026, // Ligue 1 Burkina Faso
  // Ligues européennes
  61:  2025, // Ligue 1 France
  39:  2025, // Premier League
  140: 2025, // La Liga
  135: 2025, // Serie A
  78:  2025, // Bundesliga
  // Compétitions continentales
  2:   2025, // Champions League
  3:   2025, // Europa League
  6:   2025, // CAN
  36:  2027, // CAN Qualifications
  // Compétitions internationales
  10:  2026, // Matchs amicaux
  32:  2024, // Qualifs Coupe du Monde - Europe
  34:  2026, // Qualifs Coupe du Monde - Amérique du Sud
  1:   2026, // Coupe du Monde
};

/**
 * Get the current season for a given league.
 */
export function getCurrentSeason(leagueId?: number): number {
  if (leagueId && LEAGUE_SEASONS[leagueId]) {
    return LEAGUE_SEASONS[leagueId];
  }
  // Default: if month >= August, use current year, otherwise use previous year
  const now = new Date();
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
}

/**
 * Get matches for a given date and optional league.
 * @param date - Date string in YYYY-MM-DD format
 * @param leagueId - Optional league ID to filter by
 */
export async function getMatches(date: string, leagueId?: number): Promise<MatchFixture[]> {
  const params: Record<string, string> = {
    date,
    season: String(getCurrentSeason(leagueId)),
  };
  if (leagueId) {
    params.league = String(leagueId);
  }
  return fetchApi<MatchFixture[]>("/fixtures", params);
}

/**
 * Get matches for a date range (to collect more data).
 * @param from - Start date YYYY-MM-DD
 * @param to - End date YYYY-MM-DD
 * @param leagueId - League ID
 */
export async function getMatchesByRange(from: string, to: string, leagueId: number): Promise<MatchFixture[]> {
  return fetchApi<MatchFixture[]>("/fixtures", {
    league: String(leagueId),
    season: String(getCurrentSeason(leagueId)),
    from,
    to,
  });
}

/**
 * Get full details for a specific fixture.
 * @param fixtureId - The fixture ID
 */
export async function getMatchDetails(fixtureId: number): Promise<MatchDetails[]> {
  return fetchApi<MatchDetails[]>("/fixtures", { id: String(fixtureId) });
}

/**
 * Get league standings for a given season.
 * @param leagueId - The league ID
 * @param season - The season year (e.g. 2024)
 */
export async function getStandings(leagueId: number, season: number): Promise<StandingsResponse[]> {
  return fetchApi<StandingsResponse[]>("/standings", {
    league: String(leagueId),
    season: String(season),
  });
}

/**
 * Get a team's squad.
 * @param teamId - The team ID
 */
export async function getTeamSquad(teamId: number): Promise<SquadResponse[]> {
  return fetchApi<SquadResponse[]>("/players/squads", { team: String(teamId) });
}

/**
 * Get a player's statistics for a given season.
 * @param playerId - The player ID
 * @param season - The season year (e.g. 2024)
 */
export async function getPlayerStats(playerId: number, season: number): Promise<PlayerStatistics[]> {
  return fetchApi<PlayerStatistics[]>("/players", {
    id: String(playerId),
    season: String(season),
  });
}
