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
  415: 2025, // Championnat National Bénin
  424: 2025, // Linafoot Ligue 1 RD Congo
  378: 2025, // Ligue 1 Guinée
  968: 2025, // Championnat D1 Gabon
  // Ligues européennes
  61:  2025, // Ligue 1 France
  39:  2025, // Premier League
  140: 2025, // La Liga
  135: 2025, // Serie A
  78:  2025, // Bundesliga
  // Compétitions continentales
  2:   2025, // Champions League
  3:   2025, // Europa League
  848: 2025, // Conference League
  6:   2025, // CAN
  29:  2025, // Qualifs Coupe du Monde - Afrique
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

// ============================================
// TRANSFERS
// ============================================

export interface Transfer {
  player: { id: number; name: string };
  update: string;
  transfers: {
    date: string;
    type: string; // "Free", "Loan", "N/A", or fee amount
    teams: {
      in: { id: number; name: string; logo: string };
      out: { id: number; name: string; logo: string };
    };
  }[];
}

export async function getTransfers(teamId: number): Promise<Transfer[]> {
  return fetchApi<Transfer[]>("/transfers", { team: String(teamId) });
}

export async function getPlayerTransfers(playerId: number): Promise<Transfer[]> {
  return fetchApi<Transfer[]>("/transfers", { player: String(playerId) });
}

// ============================================
// TOP SCORERS / ASSISTS / CARDS
// ============================================

export interface TopPlayer {
  player: {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number;
    nationality: string;
    photo: string;
  };
  statistics: {
    team: { id: number; name: string; logo: string };
    league: { id: number; name: string; logo: string };
    games: { appearances: number; lineups: number; minutes: number; rating: string | null };
    goals: { total: number | null; assists: number | null; conceded: number | null; saves: number | null };
    passes: { total: number | null; key: number | null; accuracy: number | null };
    shots: { total: number | null; on: number | null };
    cards: { yellow: number; yellowred: number; red: number };
    penalty: { scored: number | null; missed: number | null };
  }[];
}

export async function getTopScorers(leagueId: number, season: number): Promise<TopPlayer[]> {
  return fetchApi<TopPlayer[]>("/players/topscorers", {
    league: String(leagueId),
    season: String(season),
  });
}

export async function getTopAssists(leagueId: number, season: number): Promise<TopPlayer[]> {
  return fetchApi<TopPlayer[]>("/players/topassists", {
    league: String(leagueId),
    season: String(season),
  });
}

export async function getTopYellowCards(leagueId: number, season: number): Promise<TopPlayer[]> {
  return fetchApi<TopPlayer[]>("/players/topyellowcards", {
    league: String(leagueId),
    season: String(season),
  });
}

export async function getTopRedCards(leagueId: number, season: number): Promise<TopPlayer[]> {
  return fetchApi<TopPlayer[]>("/players/topredcards", {
    league: String(leagueId),
    season: String(season),
  });
}

// ============================================
// PREDICTIONS & HEAD TO HEAD
// ============================================

export interface Prediction {
  predictions: {
    winner: { id: number; name: string; comment: string } | null;
    win_or_draw: boolean;
    under_over: string | null;
    goals: { home: string; away: string };
    advice: string;
    percent: { home: string; draw: string; away: string };
  };
  league: { id: number; name: string; logo: string };
  teams: {
    home: { id: number; name: string; logo: string; last_5: { form: string; att: string; def: string; goals: { for: { total: number }; against: { total: number } } } };
    away: { id: number; name: string; logo: string; last_5: { form: string; att: string; def: string; goals: { for: { total: number }; against: { total: number } } } };
  };
  comparison: Record<string, { home: string; away: string }>;
  h2h: MatchFixture[];
}

export async function getPredictions(fixtureId: number): Promise<Prediction[]> {
  return fetchApi<Prediction[]>("/predictions", { fixture: String(fixtureId) });
}

export async function getHeadToHead(team1Id: number, team2Id: number, last?: number): Promise<MatchFixture[]> {
  const params: Record<string, string> = {
    h2h: `${team1Id}-${team2Id}`,
  };
  if (last) params.last = String(last);
  return fetchApi<MatchFixture[]>("/fixtures/headtohead", params);
}

// ============================================
// INJURIES / SIDELINED
// ============================================

export interface Injury {
  player: { id: number; name: string; photo: string; type: string; reason: string };
  team: { id: number; name: string; logo: string };
  fixture: { id: number; date: string };
  league: { id: number; name: string; country: string; logo: string; flag: string; season: number };
}

export async function getInjuries(fixtureId: number): Promise<Injury[]> {
  return fetchApi<Injury[]>("/injuries", { fixture: String(fixtureId) });
}

export async function getInjuriesByTeam(teamId: number, season: number): Promise<Injury[]> {
  return fetchApi<Injury[]>("/injuries", {
    team: String(teamId),
    season: String(season),
  });
}

// ============================================
// TEAM STATISTICS
// ============================================

export interface TeamStatistics {
  league: { id: number; name: string };
  team: { id: number; name: string; logo: string };
  form: string;
  fixtures: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    loses: { home: number; away: number; total: number };
  };
  goals: {
    for: { total: { home: number; away: number; total: number }; average: { home: string; away: string; total: string }; minute: Record<string, { total: number | null; percentage: string | null }> };
    against: { total: { home: number; away: number; total: number }; average: { home: string; away: string; total: string } };
  };
  biggest: {
    streak: { wins: number; draws: number; loses: number };
    wins: { home: string; away: string };
    loses: { home: string; away: string };
    goals: { for: { home: number; away: number }; against: { home: number; away: number } };
  };
  clean_sheet: { home: number; away: number; total: number };
  failed_to_score: { home: number; away: number; total: number };
  penalty: { scored: { total: number; percentage: string }; missed: { total: number; percentage: string } };
  lineups: { formation: string; played: number }[];
}

export async function getTeamStatistics(teamId: number, leagueId: number, season: number): Promise<TeamStatistics> {
  return fetchApi<TeamStatistics>("/teams/statistics", {
    team: String(teamId),
    league: String(leagueId),
    season: String(season),
  });
}

// ============================================
// COACHES
// ============================================

export interface Coach {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  age: number;
  birth: { date: string; place: string; country: string };
  nationality: string;
  photo: string;
  team: { id: number; name: string; logo: string };
  career: { team: { id: number; name: string; logo: string }; start: string; end: string | null }[];
}

export async function getCoach(teamId: number): Promise<Coach[]> {
  return fetchApi<Coach[]>("/coachs", { team: String(teamId) });
}

// ============================================
// VENUES
// ============================================

export interface Venue {
  id: number;
  name: string;
  address: string;
  city: string;
  country: string;
  capacity: number;
  surface: string;
  image: string;
}

export async function getVenue(venueId: number): Promise<Venue[]> {
  return fetchApi<Venue[]>("/venues", { id: String(venueId) });
}

// ============================================
// FIXTURE PLAYER RATINGS
// ============================================

export interface FixturePlayer {
  team: { id: number; name: string; logo: string };
  players: {
    player: { id: number; name: string; photo: string };
    statistics: {
      games: { minutes: number | null; number: number; position: string; rating: string | null };
      goals: { total: number | null; conceded: number | null; assists: number | null; saves: number | null };
      shots: { total: number | null; on: number | null };
      passes: { total: number | null; key: number | null; accuracy: string | null };
      tackles: { total: number | null; blocks: number | null; interceptions: number | null };
      duels: { total: number | null; won: number | null };
      dribbles: { attempts: number | null; success: number | null };
      fouls: { drawn: number | null; committed: number | null };
      cards: { yellow: number; red: number };
    }[];
  }[];
}

export async function getFixturePlayers(fixtureId: number): Promise<FixturePlayer[]> {
  return fetchApi<FixturePlayer[]>("/fixtures/players", { fixture: String(fixtureId) });
}

// ============================================
// ROUNDS
// ============================================

export async function getLeagueRounds(leagueId: number, season: number): Promise<string[]> {
  return fetchApi<string[]>("/fixtures/rounds", {
    league: String(leagueId),
    season: String(season),
  });
}
