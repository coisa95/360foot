/**
 * Mapping diffuseurs par compétition — utilisé par le prompt streaming.
 *
 * Stratégie : pour chaque compétition on liste
 *   - freeAfrica  : chaînes TNT gratuites africaines (angle différenciant)
 *   - foreignFree : chaînes étrangères gratuites accessibles via VPN (angle 01net/JdG)
 *   - paid        : diffuseurs payants officiels (Canal+, beIN, SuperSport, DAZN…)
 *
 * L'idée : le prompt Claude choisit les angles selon ce qui est disponible.
 * Compétition 100% africaine → mettre le paquet sur freeAfrica.
 * Compétition européenne → combiner freeAfrica (si nouvelle diffusion) +
 * foreignFree + VPN CTA.
 */
export interface BroadcasterEntry {
  name: string;
  country: string;
  // URL officielle du live (null si pas de direct officiel)
  liveUrl?: string;
  // pays cible où la chaîne est gratuite (code ISO 2 lettres)
  freeIn?: string[];
}

export interface CompetitionBroadcasters {
  /** Chaînes gratuites en Afrique francophone (prioritaires) */
  freeAfrica: BroadcasterEntry[];
  /** Chaînes étrangères gratuites (accessibles via VPN) */
  foreignFree: BroadcasterEntry[];
  /** Diffuseurs payants — en Afrique et en France */
  paid: BroadcasterEntry[];
  /** Note contextuelle libre que le prompt pourra réutiliser telle quelle */
  note?: string;
  /**
   * Date limite de validité des droits TV (YYYY-MM-DD).
   * Au-delà, les infos de diffusion doivent être revérifiées.
   * Absent = valide pour la saison en cours (convention).
   */
  validUntil?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Catalogue de chaînes de référence — on les réutilise pour éviter la duplication
// ──────────────────────────────────────────────────────────────────────────────
const NEW_WORLD_TV: BroadcasterEntry = {
  name: "New World TV",
  country: "TG (diffusion multi-pays Afrique)",
  liveUrl: "https://newworld.tv",
  freeIn: ["TG", "BJ", "CI", "SN", "ML", "BF", "NE", "CM", "GA", "CD"],
};
const RTI_1: BroadcasterEntry = { name: "RTI 1", country: "CI", freeIn: ["CI"] };
const RTS_1: BroadcasterEntry = { name: "RTS 1", country: "SN", freeIn: ["SN"] };
const CRTV: BroadcasterEntry = { name: "CRTV", country: "CM", freeIn: ["CM"] };
const ORTM: BroadcasterEntry = { name: "ORTM", country: "ML", freeIn: ["ML"] };
const RTB: BroadcasterEntry = { name: "RTB", country: "BF", freeIn: ["BF"] };
const ARRYADIA: BroadcasterEntry = {
  name: "Arryadia TNT",
  country: "MA",
  freeIn: ["MA"],
};
const CANAL_PLUS_AFRIQUE: BroadcasterEntry = {
  name: "Canal+ Afrique (Sport 1/2/3)",
  country: "Afrique francophone",
};
const BEIN_SPORTS: BroadcasterEntry = { name: "beIN Sports", country: "MENA" };
const SUPERSPORT: BroadcasterEntry = { name: "SuperSport", country: "Afrique anglophone" };
const DAZN_FR: BroadcasterEntry = { name: "DAZN", country: "FR" };
const CANAL_PLUS_FR: BroadcasterEntry = { name: "Canal+", country: "FR" };

// Chaînes étrangères gratuites souvent citées (via VPN)
const CLUB_RTL: BroadcasterEntry = { name: "Club RTL", country: "BE", freeIn: ["BE"] };
const RTBF_TIPIK: BroadcasterEntry = { name: "Tipik (RTBF)", country: "BE", freeIn: ["BE"] };
const SRF_ZWEI: BroadcasterEntry = { name: "SRF Zwei", country: "CH", freeIn: ["CH"] };
const ORF_1: BroadcasterEntry = { name: "ORF 1", country: "AT", freeIn: ["AT"] };
const TF1: BroadcasterEntry = { name: "TF1", country: "FR", freeIn: ["FR"] };
const M6: BroadcasterEntry = { name: "M6", country: "FR", freeIn: ["FR"] };

// ──────────────────────────────────────────────────────────────────────────────
// Mapping compétition → diffuseurs
// Les clés correspondent au champ `leagues.name` de la base (insensible casse).
// ──────────────────────────────────────────────────────────────────────────────
export const COMPETITION_BROADCASTERS: Record<string, CompetitionBroadcasters> = {
  // ─── Afrique — compétitions continentales ────────────────────────────────
  "caf champions league": {
    freeAfrica: [NEW_WORLD_TV, RTI_1, RTS_1, CRTV],
    foreignFree: [],
    paid: [CANAL_PLUS_AFRIQUE, SUPERSPORT, BEIN_SPORTS],
    note: "New World TV diffuse la majorité des matchs de la Ligue des Champions CAF en clair sur toute l'Afrique francophone.",
  },
  "caf confederation cup": {
    freeAfrica: [NEW_WORLD_TV, RTI_1, RTS_1, CRTV],
    foreignFree: [],
    paid: [CANAL_PLUS_AFRIQUE, SUPERSPORT],
    note: "New World TV diffuse aussi la Coupe de la Confédération CAF en clair.",
  },
  "africa cup of nations": {
    freeAfrica: [NEW_WORLD_TV, RTI_1, RTS_1, CRTV, ORTM, RTB, ARRYADIA],
    foreignFree: [],
    paid: [CANAL_PLUS_AFRIQUE, BEIN_SPORTS],
    note: "La CAN est diffusée en clair par la télé publique de la quasi-totalité des pays qualifiés.",
  },
  "africa cup of nations qualification": {
    freeAfrica: [RTI_1, RTS_1, CRTV, ORTM, RTB, ARRYADIA, NEW_WORLD_TV],
    foreignFree: [],
    paid: [CANAL_PLUS_AFRIQUE],
  },
  "world cup - qualification africa": {
    freeAfrica: [RTI_1, RTS_1, CRTV, ORTM, RTB, ARRYADIA, NEW_WORLD_TV],
    foreignFree: [],
    paid: [CANAL_PLUS_AFRIQUE, BEIN_SPORTS],
    note: "Les matchs des éliminatoires Coupe du Monde zone Afrique sont diffusés gratuitement par la télé d'État de chaque pays engagé.",
  },

  // ─── Afrique — ligues nationales ─────────────────────────────────────────
  "ligue 1 (senegal)": {
    freeAfrica: [RTS_1],
    foreignFree: [],
    paid: [CANAL_PLUS_AFRIQUE],
    note: "La Ligue 1 sénégalaise passe régulièrement sur RTS 1 en clair.",
  },
  "ligue 1 (ivory coast)": {
    freeAfrica: [RTI_1],
    foreignFree: [],
    paid: [CANAL_PLUS_AFRIQUE],
    note: "Les affiches du championnat ivoirien sont diffusées par RTI 1 en clair.",
  },
  "botola pro": {
    freeAfrica: [ARRYADIA],
    foreignFree: [],
    paid: [CANAL_PLUS_AFRIQUE, BEIN_SPORTS],
    note: "La Botola marocaine est en clair sur Arryadia TNT (groupe SNRT).",
  },
  "ligue 1 (cameroon)": {
    freeAfrica: [CRTV],
    foreignFree: [],
    paid: [CANAL_PLUS_AFRIQUE],
  },

  // ─── Europe — top 5 ligues ───────────────────────────────────────────────
  "uefa champions league": {
    freeAfrica: [NEW_WORLD_TV],
    foreignFree: [CLUB_RTL, RTBF_TIPIK, SRF_ZWEI, ORF_1],
    paid: [CANAL_PLUS_AFRIQUE, CANAL_PLUS_FR, BEIN_SPORTS],
    note: "New World TV a acquis des droits pour certains matchs de UCL en Afrique francophone. En Europe, RTBF Tipik (Belgique) et SRF Zwei (Suisse) diffusent une affiche par soir en clair.",
  },
  "uefa europa league": {
    freeAfrica: [],
    foreignFree: [RTBF_TIPIK, CLUB_RTL],
    paid: [CANAL_PLUS_AFRIQUE, BEIN_SPORTS],
    note: "RTBF Tipik diffuse régulièrement les matchs des clubs belges en clair.",
  },
  "uefa europa conference league": {
    freeAfrica: [],
    foreignFree: [RTBF_TIPIK],
    paid: [CANAL_PLUS_AFRIQUE, BEIN_SPORTS],
  },
  "ligue 1": {
    freeAfrica: [],
    foreignFree: [],
    paid: [CANAL_PLUS_AFRIQUE, DAZN_FR, BEIN_SPORTS, CANAL_PLUS_FR],
    note: "Pas de diffusion en clair régulière : DAZN (France) et Canal+ Afrique se partagent les matchs.",
  },
  "premier league": {
    freeAfrica: [],
    foreignFree: [],
    paid: [CANAL_PLUS_AFRIQUE, SUPERSPORT, BEIN_SPORTS],
    note: "La Premier League est intégralement cryptée — aucune chaîne gratuite ne la diffuse.",
  },
  "la liga": {
    freeAfrica: [],
    foreignFree: [],
    paid: [CANAL_PLUS_AFRIQUE, BEIN_SPORTS],
  },
  "serie a": {
    freeAfrica: [],
    foreignFree: [],
    paid: [CANAL_PLUS_AFRIQUE, BEIN_SPORTS],
  },
  "bundesliga": {
    freeAfrica: [],
    foreignFree: [],
    paid: [CANAL_PLUS_AFRIQUE, BEIN_SPORTS],
  },

  // ─── Compétitions internationales ────────────────────────────────────────
  "world cup": {
    freeAfrica: [RTI_1, RTS_1, CRTV, ORTM, RTB, ARRYADIA, NEW_WORLD_TV],
    foreignFree: [TF1, M6],
    paid: [BEIN_SPORTS, CANAL_PLUS_AFRIQUE],
    note: "La Coupe du Monde est diffusée en clair par la télé publique de chaque pays — en Afrique francophone et en France (TF1/M6).",
  },
  "euro championship": {
    freeAfrica: [],
    foreignFree: [TF1, M6, RTBF_TIPIK, SRF_ZWEI],
    paid: [CANAL_PLUS_AFRIQUE, BEIN_SPORTS],
  },
  "friendlies": {
    freeAfrica: [],
    foreignFree: [],
    paid: [CANAL_PLUS_AFRIQUE, BEIN_SPORTS],
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/** Normalise un nom de compétition pour matcher les clés du mapping */
function normalizeCompetition(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.]/g, "");
}

/** Renvoie le mapping le plus proche — fallback générique si inconnu */
export function getBroadcasters(competition: string): CompetitionBroadcasters {
  const key = normalizeCompetition(competition);
  if (COMPETITION_BROADCASTERS[key]) return COMPETITION_BROADCASTERS[key];

  // Matching par mots-clés
  if (/caf.*champions/i.test(competition)) return COMPETITION_BROADCASTERS["caf champions league"];
  if (/caf.*confederation|confed/i.test(competition)) return COMPETITION_BROADCASTERS["caf confederation cup"];
  if (/africa.*cup.*nations|afcon|can/i.test(competition) && !/qualif/i.test(competition)) {
    return COMPETITION_BROADCASTERS["africa cup of nations"];
  }
  if (/africa.*qualif|afcon.*qualif/i.test(competition)) {
    return COMPETITION_BROADCASTERS["africa cup of nations qualification"];
  }
  if (/world cup.*qualif.*africa|qualif.*world.*africa/i.test(competition)) {
    return COMPETITION_BROADCASTERS["world cup - qualification africa"];
  }
  if (/champions league|ucl/i.test(competition)) return COMPETITION_BROADCASTERS["uefa champions league"];
  if (/europa league/i.test(competition)) return COMPETITION_BROADCASTERS["uefa europa league"];
  if (/conference league/i.test(competition)) return COMPETITION_BROADCASTERS["uefa europa conference league"];
  if (/premier league/i.test(competition)) return COMPETITION_BROADCASTERS["premier league"];
  if (/la liga|laliga/i.test(competition)) return COMPETITION_BROADCASTERS["la liga"];
  if (/serie a/i.test(competition)) return COMPETITION_BROADCASTERS["serie a"];
  if (/bundesliga/i.test(competition)) return COMPETITION_BROADCASTERS["bundesliga"];
  if (/ligue 1.*sen|senegal.*ligue/i.test(competition)) return COMPETITION_BROADCASTERS["ligue 1 (senegal)"];
  if (/ligue 1.*ivory|cote.*ivoire|cote d'ivoire/i.test(competition)) return COMPETITION_BROADCASTERS["ligue 1 (ivory coast)"];
  if (/botola/i.test(competition)) return COMPETITION_BROADCASTERS["botola pro"];
  if (/ligue 1.*cameroon|mtn elite/i.test(competition)) return COMPETITION_BROADCASTERS["ligue 1 (cameroon)"];
  if (/ligue 1/i.test(competition)) return COMPETITION_BROADCASTERS["ligue 1"];
  if (/world cup/i.test(competition)) return COMPETITION_BROADCASTERS["world cup"];
  if (/euro\s*\d|euro championship/i.test(competition)) return COMPETITION_BROADCASTERS["euro championship"];

  // Fallback minimal
  return {
    freeAfrica: [],
    foreignFree: [],
    paid: [CANAL_PLUS_AFRIQUE, BEIN_SPORTS],
    note: "Pas de diffusion en clair identifiée pour cette compétition — options payantes uniquement.",
  };
}

/** True si la compétition est africaine (on évite alors l'angle VPN) */
export function isAfricanCompetition(competition: string): boolean {
  return /caf|afcon|africa|african|cote d'ivoire|ivory coast|senegal|cameroon|botola|morocco|marocain|nigerian|ghanaian|egyp|tunisi|algeri/i.test(
    competition
  );
}
