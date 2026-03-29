export interface ArticleImageInput {
  title: string;
  teams: string[];
  league: string;
  competition?: string;
  type: string;
  tags: string[];
  venuePhotoUrl?: string;
  venueName?: string;
  venueCity?: string;
  // API-Football images
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  leagueLogo?: string;
  goalScorerPhotos?: { name: string; photo: string; team: string }[];
  // RSS source image
  rssImageUrl?: string;
}

export interface ArticleContext {
  title: string;
  content: string;
  teams: string[];
  league: string;
  tags: string[];
  type: string;
}

// ============================================
// ÉTAPE 1 : Détecter le contexte principal
// ============================================

export interface DetectedContext {
  players: string[];
  nationalities: string[];
  action: string;
  competition: string;
  emotion: string;
}

const PLAYER_NATIONALITY: Record<string, string> = {
  "mbappé": "french", "mbappe": "french", "griezmann": "french",
  "dembélé": "french", "kolo muani": "french",
  "mané": "senegalese", "mane": "senegalese",
  "sadio": "senegalese", "koulibaly": "senegalese",
  "salah": "egyptian", "mohamed salah": "egyptian",
  "osimhen": "nigerian", "victor osimhen": "nigerian",
  "hakimi": "moroccan", "achraf": "moroccan",
  "onana": "cameroonian", "anguissa": "cameroonian",
  "mbeumo": "cameroonian", "bryan mbeumo": "cameroonian",
  "haller": "ivorian", "sébastien haller": "ivorian",
  "pépé": "ivorian", "nicolas pépé": "ivorian",
  "diomandé": "ivorian", "yan diomandé": "ivorian",
  "keita": "malian", "bissouma": "malian",
  "traoré": "burkinabe",
  "ronaldo": "portuguese", "messi": "argentinian",
  "neymar": "brazilian", "benzema": "french",
  "vinicius": "brazilian", "bellingham": "english",
  "haaland": "norwegian", "yamal": "spanish",
};

export function detectContext(article: ArticleContext): DetectedContext {
  const text = `${article.title} ${article.content}`.toLowerCase();

  const detectedPlayers: string[] = [];
  const detectedNationalities: string[] = [];

  for (const [player, nationality] of Object.entries(PLAYER_NATIONALITY)) {
    if (text.includes(player)) {
      detectedPlayers.push(player);
      if (!detectedNationalities.includes(nationality)) {
        detectedNationalities.push(nationality);
      }
    }
  }

  // Détecter l'action
  let action = "match";
  if (text.includes("but") || text.includes("goal") || text.includes("marqu")) action = "goal";
  if (text.includes("transfert") || text.includes("mercato") || text.includes("sign")) action = "transfer";
  if (text.includes("bless") || text.includes("forfait") || text.includes("absent")) action = "injury";
  if (text.includes("victoire") || text.includes("sacre") || text.includes("remport")) action = "celebration";
  if (text.includes("entraîn") || text.includes("prépare") || text.includes("stage")) action = "training";

  // Détecter la compétition
  let competition = "football";
  if (text.includes("ligue 1") || text.includes("ligue1")) competition = "ligue1";
  if (text.includes("premier league")) competition = "premier_league";
  if (text.includes("can") || text.includes("afcon") || text.includes("coupe d'afrique")) competition = "can";
  if (text.includes("champions league") || text.includes("ligue des champions")) competition = "champions_league";
  if (text.includes("coupe du monde") || text.includes("world cup")) competition = "world_cup";
  if (text.includes("la liga") || text.includes("liga")) competition = "la_liga";
  if (text.includes("serie a")) competition = "serie_a";

  // Détecter l'émotion
  let emotion = "determination";
  if (text.includes("victoire") || text.includes("sacre") || text.includes("triomphe") || text.includes("joie")) emotion = "celebration";
  if (text.includes("défaite") || text.includes("élimin") || text.includes("déception")) emotion = "sadness";
  if (text.includes("derby") || text.includes("choc") || text.includes("tension")) emotion = "tension";

  return {
    players: detectedPlayers,
    nationalities: detectedNationalities,
    action,
    competition,
    emotion,
  };
}

// ============================================
// ÉTAPE 2 : Mappings de queries contextuelles
// ============================================

const NATIONALITY_QUERIES: Record<string, string[]> = {
  french: [
    "french supporters celebrating goal",
    "france national team fans cheering stadium",
    "french football fans blue white red flags",
  ],
  senegalese: [
    "senegalese supporters celebrating",
    "senegal football fans cheering goal",
    "african football supporters senegal flag",
  ],
  ivorian: [
    "ivory coast football fans celebrating",
    "african supporters orange green flags stadium",
    "cote divoire football crowd cheering",
  ],
  cameroonian: [
    "cameroon football fans celebrating",
    "african football supporters green red yellow",
    "cameroon indomitable lions fans stadium",
  ],
  malian: [
    "african football supporters mali",
    "west african football fans celebration",
    "mali supporters stadium cheering",
  ],
  burkinabe: [
    "burkina faso football fans",
    "african supporters west africa stadium",
    "burkina football celebration crowd",
  ],
  moroccan: [
    "moroccan football fans celebrating",
    "morocco supporters cheering stadium",
    "moroccan fans red green flags football",
  ],
  egyptian: [
    "egyptian football fans celebrating",
    "egypt supporters cheering stadium",
    "egyptian football crowd pharaohs",
  ],
  nigerian: [
    "nigerian football fans celebrating",
    "nigeria supporters green white stadium",
    "nigerian football crowd super eagles",
  ],
  portuguese: [
    "portuguese football fans celebrating",
    "portugal supporters stadium cheering",
  ],
  argentinian: [
    "argentinian football fans celebrating",
    "argentina supporters blue white stadium",
  ],
  brazilian: [
    "brazilian football fans celebrating",
    "brazil supporters yellow green stadium",
  ],
  english: [
    "english football fans celebrating",
    "england supporters stadium cheering",
  ],
  norwegian: [
    "norwegian football fans",
    "scandinavian football supporters",
  ],
  spanish: [
    "spanish football fans celebrating",
    "spain supporters stadium cheering",
  ],
};

const ACTION_QUERIES: Record<string, string[]> = {
  goal: [
    "soccer player celebrating goal",
    "football player scoring goal celebration",
    "striker shooting ball into net",
  ],
  transfer: [
    "football player signing contract",
    "soccer player training session new club",
    "footballer presentation new team jersey",
  ],
  injury: [
    "football player injured on pitch",
    "soccer player stretcher medical team",
    "footballer knee injury treatment",
  ],
  celebration: [
    "football team celebrating victory trophy",
    "soccer players hugging after winning",
    "football team lifting trophy celebration",
  ],
  training: [
    "football team training session pitch",
    "soccer players training drill",
    "football training camp preparation",
  ],
  match: [
    "football match stadium atmosphere night",
    "soccer game action two teams playing",
    "football stadium crowd match day",
  ],
};

const COMPETITION_QUERIES: Record<string, string[]> = {
  ligue1: [
    "french football stadium ligue 1 atmosphere",
    "france soccer match night stadium",
  ],
  premier_league: [
    "english football stadium premier league",
    "england soccer match packed stadium",
  ],
  can: [
    "african football fans celebration stadium",
    "africa cup of nations crowd atmosphere",
    "african football supporters drums dancing",
  ],
  champions_league: [
    "champions league football night stadium",
    "european football floodlights big match",
  ],
  world_cup: [
    "world cup football fans international",
    "international football stadium crowd flags",
  ],
  la_liga: [
    "spanish football stadium la liga",
    "spain soccer match atmosphere",
  ],
  serie_a: [
    "italian football stadium serie a",
    "italy soccer match ultras atmosphere",
  ],
  football: [
    "football stadium night match atmosphere",
    "soccer action dynamic shot",
  ],
};

// ============================================
// ÉTAPE 3 : Générer les queries contextuelles
// ============================================

export function generateContextualQueries(article: ArticleContext): string[] {
  const ctx = detectContext(article);
  const queries: string[] = [];

  // PRIORITÉ 1 : Queries basées sur la nationalité du joueur
  for (const nationality of ctx.nationalities) {
    const natQueries = NATIONALITY_QUERIES[nationality];
    if (natQueries) {
      queries.push(natQueries[0]);
    }
  }

  // PRIORITÉ 2 : Queries basées sur l'action
  const actionQueries = ACTION_QUERIES[ctx.action];
  if (actionQueries) {
    queries.push(actionQueries[0]);
  }

  // PRIORITÉ 3 : Queries basées sur la compétition
  const compQueries = COMPETITION_QUERIES[ctx.competition];
  if (compQueries) {
    queries.push(compQueries[0]);
  }

  // PRIORITÉ 4 : Combinaison nationalité + action (le plus précis → en premier)
  if (ctx.nationalities.length > 0 && ctx.action !== "match") {
    const nat = ctx.nationalities[0];
    queries.unshift(`${nat} footballer ${ctx.action} celebration`);
  }

  // PRIORITÉ 5 : Fallback générique de qualité
  if (queries.length === 0) {
    queries.push("football stadium night match atmosphere");
    queries.push("soccer action dynamic shot");
  }

  // Dédupliquer et limiter à 4 queries max
  return Array.from(new Set(queries)).slice(0, 4);
}

// ============================================
// ÉTAPE 4 : Sélection intelligente
// ============================================

import type { PexelsPhoto } from "./image-cache";

export function selectBestImage(
  photos: PexelsPhoto[],
  ctx: DetectedContext
): PexelsPhoto | null {
  if (photos.length === 0) return null;

  // Filtrer : paysage uniquement, résolution min 1200px
  const filtered = photos.filter(p => {
    if (p.width < p.height) return false;
    if (p.width < 1200) return false;
    const ratio = p.width / p.height;
    if (ratio < 1.3 || ratio > 2.5) return false;
    return true;
  });

  if (filtered.length === 0) return photos[0];

  // Scorer chaque image par pertinence
  const scored = filtered.map(photo => {
    let score = 0;
    const alt = (photo.alt || "").toLowerCase();

    // Bonus si l'alt mentionne football/soccer
    if (alt.includes("football") || alt.includes("soccer")) score += 3;
    if (alt.includes("stadium") || alt.includes("crowd")) score += 2;
    if (alt.includes("celebration") || alt.includes("goal")) score += 2;

    // Bonus si nationalité détectée dans l'alt
    for (const nat of ctx.nationalities) {
      if (alt.includes(nat.replace("ese", "").replace("ian", ""))) score += 5;
    }

    // Bonus résolution haute
    if (photo.width >= 1920) score += 1;

    return { photo, score };
  });

  // Trier par score décroissant
  scored.sort((a, b) => b.score - a.score);

  return scored[0].photo;
}

// ============================================
// ÉTAPE 5 : Vérification contextuelle
// ============================================

export function isImageContextual(
  photo: PexelsPhoto,
  article: ArticleContext
): boolean {
  const alt = (photo.alt || "").toLowerCase();
  const title = article.title.toLowerCase();

  const sportKeywords = [
    "football", "soccer", "stadium", "match", "goal", "player",
    "team", "fan", "supporter", "celebration", "pitch", "ball",
    "sport", "athlete", "crowd", "cheer",
  ];

  const hasRelevantContent = sportKeywords.some(kw => alt.includes(kw) || title.includes(kw));

  if (!hasRelevantContent) {
    console.warn(`Image rejetée (hors contexte): ${photo.alt}`);
    return false;
  }

  return true;
}

// Keep backward compat — old code may still call generateImageQueries
export function generateImageQueries(input: ArticleImageInput): string[] {
  return generateContextualQueries({
    title: input.title,
    content: "",
    teams: input.teams,
    league: input.league,
    tags: input.tags,
    type: input.type,
  });
}
