/**
 * Transfermarkt API client
 * Base URL: https://transfermarkt-api.fly.dev
 * Rate limit: 1 request/second (self-imposed)
 * No API key required
 */

const BASE_URL = "https://transfermarkt-api.fly.dev";

// ============================================
// INTERFACES
// ============================================

export interface TmPlayerProfile {
  id: string;
  url: string;
  name: string;
  description: string;
  nameInHomeCountry: string;
  imageURL: string;
  dateOfBirth: string;
  placeOfBirth: { city: string; country: string };
  age: string;
  height: string;
  citizenship: string[];
  isRetired: boolean;
  position: { main: string; other: string[] };
  foot: string;
  shirtNumber: string;
  club: { id: string; name: string; joined: string; contractExpires: string };
  marketValue: { current: string; highest: string };
  agent: { name: string; url: string };
}

export interface TmPlayerMarketValue {
  current: string;
  highest: string;
  history: {
    age: string;
    date: string;
    clubName: string;
    value: string;
    clubID: string;
  }[];
}

export interface TmTransfer {
  id: string;
  from: { clubID: string; clubName: string; clubImage: string };
  to: { clubID: string; clubName: string; clubImage: string };
  date: string;
  fee: string;
  movementType: string;
  isLoan: boolean;
}

export interface TmPlayerTransfers {
  transfers: TmTransfer[];
}

export interface TmClubPlayer {
  id: string;
  name: string;
  position: string;
  dateOfBirth: string;
  age: string;
  nationality: string[];
  height: string;
  foot: string;
  joinedOn: string;
  joined: string;
  signedFrom: string;
  contract: string;
  marketValue: string;
  status: string;
  shirtNumber?: string;
  imageURL?: string;
}

export interface TmClubPlayers {
  id: string;
  clubName: string;
  seasonID: string;
  players: TmClubPlayer[];
}

export interface TmClubProfile {
  id: string;
  url: string;
  name: string;
  officialName: string;
  image: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  tel: string;
  fax: string;
  website: string;
  foundedOn: string;
  members: string;
  membersDate: string;
  otherSports: string[];
  colors: string[];
  stadiumName: string;
  stadiumSeats: string;
  currentTransferRecord: string;
  currentMarketValue: string;
  squad: { size: string; averageAge: string; foreigners: string; nationalTeamPlayers: string };
  league: { id: string; name: string; countryID: string; countryName: string; tier: string };
  historicalCrests: string[];
}

export interface TmSearchResult {
  id: string;
  name: string;
  position?: string;
  club?: { id: string; name: string };
  nationality?: string[];
  age?: string;
  marketValue?: string;
  imageURL?: string;
}

// ============================================
// RATE LIMITER (1 req/sec)
// ============================================

let lastRequestTime = 0;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 1100) {
    await new Promise((r) => setTimeout(r, 1100 - elapsed));
  }
  lastRequestTime = Date.now();

  const response = await fetch(url, {
    headers: { "User-Agent": "360Foot/1.0" },
  });

  if (!response.ok) {
    throw new Error(`Transfermarkt API error: ${response.status} ${response.statusText}`);
  }

  return response;
}

async function fetchTm<T>(endpoint: string): Promise<T> {
  const response = await rateLimitedFetch(`${BASE_URL}${endpoint}`);
  return response.json();
}

// ============================================
// API METHODS
// ============================================

/** Search players by name */
export async function searchPlayers(name: string, page = 1): Promise<{ results: TmSearchResult[] }> {
  return fetchTm(`/players/search/${encodeURIComponent(name)}?page_number=${page}`);
}

/** Get detailed player profile */
export async function getPlayerProfile(playerId: string): Promise<TmPlayerProfile> {
  return fetchTm(`/players/${playerId}/profile`);
}

/** Get player market value history */
export async function getPlayerMarketValue(playerId: string): Promise<TmPlayerMarketValue> {
  return fetchTm(`/players/${playerId}/market_value`);
}

/** Get player transfer history */
export async function getPlayerTransfers(playerId: string): Promise<TmPlayerTransfers> {
  return fetchTm(`/players/${playerId}/transfers`);
}

/** Get player stats */
export async function getPlayerStats(playerId: string): Promise<unknown> {
  return fetchTm(`/players/${playerId}/stats`);
}

/** Get player injuries */
export async function getPlayerInjuries(playerId: string, page = 1): Promise<unknown> {
  return fetchTm(`/players/${playerId}/injuries?page_number=${page}`);
}

/** Search clubs by name */
export async function searchClubs(name: string, page = 1): Promise<{ results: TmSearchResult[] }> {
  return fetchTm(`/clubs/search/${encodeURIComponent(name)}?page_number=${page}`);
}

/** Get club profile */
export async function getClubProfile(clubId: string): Promise<TmClubProfile> {
  return fetchTm(`/clubs/${clubId}/profile`);
}

/** Get club players/roster */
export async function getClubPlayers(clubId: string, seasonId?: string): Promise<TmClubPlayers> {
  const qs = seasonId ? `?season_id=${seasonId}` : "";
  return fetchTm(`/clubs/${clubId}/players${qs}`);
}

/** Get competition clubs */
export async function getCompetitionClubs(competitionId: string, seasonId?: string): Promise<unknown> {
  const qs = seasonId ? `?season_id=${seasonId}` : "";
  return fetchTm(`/competitions/${competitionId}/clubs${qs}`);
}

// ============================================
// HELPERS
// ============================================

/**
 * Parse a market value string like "€25.00m" or "€500k" into a number (in euros).
 */
export function parseMarketValue(value: string | undefined | null): number {
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9.mkMK€]/g, "");
  const num = parseFloat(cleaned.replace(/[mkMK€]/g, ""));
  if (isNaN(num)) return 0;
  if (/m/i.test(value)) return num * 1_000_000;
  if (/k/i.test(value)) return num * 1_000;
  return num;
}

/**
 * Format a number to a human-readable market value string.
 */
export function formatMarketValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M €`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K €`;
  if (value > 0) return `${value} €`;
  return "N/C";
}
