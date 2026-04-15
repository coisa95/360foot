/**
 * Registre des médias africains locaux qui couvrent les championnats nationaux.
 *
 * Chaque source est scopée sur UN championnat (ligue pro senior masculine).
 * Le champ `leagueSlug` est utilisé pour tagguer l'article en BDD (`articles.league_id`).
 *
 * Éthique du scraping :
 * - Flux RSS publics uniquement (pas de bypass anti-bot)
 * - Attribution systématique : "Source : [média] + lien" en fin d'article
 * - Rate limiting par domaine (géré dans le cron)
 * - Réécriture intégrale par Claude (pas de copie) → contenu dérivé, pas duplicate
 */

export interface AfricanSource {
  /** Identifiant unique pour logs/dédup */
  id: string;
  /** Nom affiché dans la mention "Source : ..." */
  source: string;
  /** URL RSS (catégorie football/sport en priorité). Ignoré si fetchMode=html. */
  rssUrl: string;
  /** URL officielle publique (pour référence) */
  siteUrl: string;
  /** Code pays ISO (CI, SN, CM, …) */
  country: string;
  /** Slug de la ligue en BDD (doit exister dans `leagues.slug`) */
  leagueSlug: string;
  /** Nom lisible du championnat (pour logs + prompt enrichment) */
  championshipName: string;
  /** Fiabilité éditoriale : 1 = excellent, 2 = bon, 3 = variable */
  reliability: 1 | 2 | 3;
  /** CMS détecté (info seule, pas utilisé par le parser) */
  cms?: "wordpress" | "custom" | "ghost" | "nuxt" | "arc";
  /** Mode de récupération : RSS (défaut) ou HTML scraping */
  fetchMode?: "rss" | "html";
  /** Config HTML scraping (requis si fetchMode=html) */
  htmlConfig?: {
    listingUrl: string;
    /** Regex matchant les attributs href vers les articles */
    articleUrlRegex: RegExp;
    baseUrl: string;
    maxArticles?: number;
    parser?: "jsonld" | "opengraph";
  };
  /** Notes opérationnelles */
  note?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Registre des sources — V1 Bénin seulement (à étendre après audit RSS)
// ──────────────────────────────────────────────────────────────────────────────
export const AFRICAN_SOURCES: AfricanSource[] = [
  // ─── Bénin — Celtiis Ligue 1 ────────────────────────────────────────────
  {
    id: "benin-sports-football",
    source: "Benin-sports",
    rssUrl: "https://www.benin-sports.com/category/football/feed/",
    siteUrl: "https://www.benin-sports.com",
    country: "BJ",
    leagueSlug: "celtiis-ligue-1-benin",
    championshipName: "Celtiis Ligue 1 (Bénin)",
    reliability: 1,
    cms: "wordpress",
    note: "RSS LiteSpeed cache, 160 items récents.",
  },
  {
    id: "229foot-main",
    source: "229Foot",
    rssUrl: "https://229foot.com/feed/",
    siteUrl: "https://229foot.com",
    country: "BJ",
    leagueSlug: "celtiis-ligue-1-benin",
    championshipName: "Celtiis Ligue 1 (Bénin)",
    reliability: 1,
    cms: "wordpress",
    note: "Pure player foot béninois + CAF.",
  },
  {
    id: "febefoot-official",
    source: "Fédération Béninoise de Football",
    rssUrl: "https://febefoot.org/feed/",
    siteUrl: "https://febefoot.org",
    country: "BJ",
    leagueSlug: "celtiis-ligue-1-benin",
    championshipName: "Celtiis Ligue 1 (Bénin)",
    reliability: 1,
    cms: "wordpress",
    note: "Fédération officielle — communiqués institutionnels.",
  },

  // ─── Sénégal — Ligue Pro ────────────────────────────────────────────────
  {
    id: "wiwsport-football",
    source: "Wiwsport",
    rssUrl: "https://wiwsport.com/football/feed/",
    siteUrl: "https://wiwsport.com",
    country: "SN",
    leagueSlug: "ligue-pro-senegal",
    championshipName: "Ligue Pro Sénégal",
    reliability: 1,
    cms: "wordpress",
    note: "100% sport sénégalais — feed foot catégorisé.",
  },
  {
    id: "galsenfoot-main",
    source: "Galsenfoot",
    rssUrl: "https://galsenfoot.sn/feed/",
    siteUrl: "https://galsenfoot.sn",
    country: "SN",
    leagueSlug: "ligue-pro-senegal",
    championshipName: "Ligue Pro Sénégal",
    reliability: 1,
    cms: "wordpress",
    note: "Pure player foot sénégalais.",
  },
  {
    id: "fsfoot-official",
    source: "Fédération Sénégalaise de Football",
    rssUrl: "https://fsfoot.sn/feed/",
    siteUrl: "https://fsfoot.sn",
    country: "SN",
    leagueSlug: "ligue-pro-senegal",
    championshipName: "Ligue Pro Sénégal",
    reliability: 1,
    cms: "wordpress",
    note: "Fédération officielle.",
  },

  // ─── Côte d'Ivoire — Ligue 1 MTN ────────────────────────────────────────
  {
    id: "225foot-main",
    source: "225Foot",
    rssUrl: "https://225foot.com/feed/",
    siteUrl: "https://225foot.com",
    country: "CI",
    leagueSlug: "ligue-1-cote-divoire",
    championshipName: "Ligue 1 MTN (Côte d'Ivoire)",
    reliability: 1,
    cms: "wordpress",
    note: "Pure player foot CIV.",
  },
  {
    id: "kpakpato-sportif",
    source: "Le Kpakpato Sportif",
    rssUrl: "https://lekpakpatosportif.net/feed/",
    siteUrl: "https://lekpakpatosportif.net",
    country: "CI",
    leagueSlug: "ligue-1-cote-divoire",
    championshipName: "Ligue 1 MTN (Côte d'Ivoire)",
    reliability: 2,
    cms: "wordpress",
    note: "Média sport CIV (foot + basket + autres disciplines) — fallback média sport pays.",
  },
  {
    id: "sport-ivoire-ligue1",
    source: "Sport-ivoire.ci",
    rssUrl: "", // pas de RSS — scraping HTML (Drupal)
    siteUrl: "https://www.sport-ivoire.ci/football-1",
    country: "CI",
    leagueSlug: "ligue-1-cote-divoire",
    championshipName: "Ligue 1 MTN (Côte d'Ivoire)",
    reliability: 1,
    cms: "custom",
    fetchMode: "html",
    htmlConfig: {
      listingUrl: "https://www.sport-ivoire.ci/football-1",
      // Capture uniquement les articles de la catégorie "football-ligue-1" (L1 CIV)
      articleUrlRegex: /href="\/football-ligue-1\/[^"]+"/g,
      baseUrl: "https://www.sport-ivoire.ci",
      maxArticles: 10,
      parser: "opengraph",
    },
    note: "Drupal — OpenGraph propre. Catégorie /football-ligue-1/ = LONACI L1 CIV pur.",
  },

  // ─── Cameroun — Elite One ───────────────────────────────────────────────
  {
    id: "camfoot-main",
    source: "Camfoot",
    rssUrl: "https://www.camfoot.com/feed",
    siteUrl: "https://www.camfoot.com",
    country: "CM",
    leagueSlug: "elite-one-cameroun",
    championshipName: "Elite One (Cameroun)",
    reliability: 1,
    cms: "wordpress",
    note: "Référence historique foot camerounais.",
  },
  {
    id: "fecafoot-official",
    source: "FECAFOOT",
    rssUrl: "https://fecafoot-officiel.com/feed/",
    siteUrl: "https://fecafoot-officiel.com",
    country: "CM",
    leagueSlug: "elite-one-cameroun",
    championshipName: "Elite One (Cameroun)",
    reliability: 1,
    cms: "wordpress",
    note: "Fédération officielle — communiqués MTN Elite One directs.",
  },
  {
    id: "sports24cameroon-main",
    source: "Sports24 Cameroon",
    rssUrl: "https://www.sports24cameroon.com/feed/",
    siteUrl: "https://www.sports24cameroon.com",
    country: "CM",
    leagueSlug: "elite-one-cameroun",
    championshipName: "Elite One (Cameroun)",
    reliability: 2,
    cms: "wordpress",
    note: "Sport camerounais (foot majoritaire).",
  },

  // ─── Tunisie — Ligue 1 ──────────────────────────────────────────────────
  {
    id: "tunisie-foot-football",
    source: "Tunisie-Foot",
    rssUrl: "https://tunisie-foot.com/category/football/feed/",
    siteUrl: "https://tunisie-foot.com",
    country: "TN",
    leagueSlug: "ligue-1-tunisie",
    championshipName: "Ligue 1 Pro Tunisie",
    reliability: 1,
    cms: "wordpress",
  },
  {
    id: "footballtunisien-main",
    source: "Football Tunisien",
    rssUrl: "https://www.footballtunisien.com/feed/",
    siteUrl: "https://www.footballtunisien.com",
    country: "TN",
    leagueSlug: "ligue-1-tunisie",
    championshipName: "Ligue 1 Pro Tunisie",
    reliability: 1,
    cms: "wordpress",
    note: "Pure player L1 + sélection + tunisiens en Europe.",
  },
  {
    id: "ftf-official",
    source: "Fédération Tunisienne de Football",
    rssUrl: "https://www.ftf.org.tn/fr/feed",
    siteUrl: "https://www.ftf.org.tn/fr/",
    country: "TN",
    leagueSlug: "ligue-1-tunisie",
    championshipName: "Ligue 1 Pro Tunisie",
    reliability: 1,
    cms: "wordpress",
    note: "Fédération officielle (version FR).",
  },

  // ─── Maroc — Botola Pro ─────────────────────────────────────────────────
  // Sources FR spécialisées rares — sources arabes non incluses (prompt FR).
  {
    id: "marocfoot-main",
    source: "Maroc Foot",
    rssUrl: "https://marocfoot.net/feed/",
    siteUrl: "https://marocfoot.net",
    country: "MA",
    leagueSlug: "botola-pro",
    championshipName: "Botola Pro (Maroc)",
    reliability: 3,
    cms: "wordpress",
    note: "FR spécialisé Botola/Atlas — mais flux stale (dernier post avr 2025). À monitor, phase 2 HTML si mort.",
  },
  {
    id: "aujourdhui-maroc-sports",
    source: "Aujourd'hui le Maroc — Sports",
    rssUrl: "https://aujourdhui.ma/category/sports/feed",
    siteUrl: "https://aujourdhui.ma/category/sports",
    country: "MA",
    leagueSlug: "botola-pro",
    championshipName: "Botola Pro (Maroc)",
    reliability: 2,
    cms: "wordpress",
    note: "Catégorie sports (foot dominant Botola + Lions Atlas) — fallback média sport pays.",
  },
  {
    id: "le360-sport-botola",
    source: "Le360 Sport",
    rssUrl: "", // pas de RSS — scraping HTML
    siteUrl: "https://sport.le360.ma/football/botola",
    country: "MA",
    leagueSlug: "botola-pro",
    championshipName: "Botola Pro (Maroc)",
    reliability: 1,
    cms: "arc",
    fetchMode: "html",
    htmlConfig: {
      listingUrl: "https://sport.le360.ma/football/botola",
      articleUrlRegex: /href="\/football\/botola\/[a-z0-9-]+_[A-Z0-9]+\/"/g,
      baseUrl: "https://sport.le360.ma",
      maxArticles: 10,
      parser: "jsonld",
    },
    note: "Média #1 Maroc (Arc Publishing). Pas de RSS — scraping HTML via JSON-LD.",
  },

  // ─── RDC — LINAFOOT ─────────────────────────────────────────────────────
  {
    id: "footrdc-main",
    source: "Foot RDC",
    rssUrl: "https://footrdc.com/feed/",
    siteUrl: "https://footrdc.com",
    country: "CD",
    leagueSlug: "linafoot-rdc",
    championshipName: "LINAFOOT (RDC)",
    reliability: 1,
    cms: "wordpress",
    note: "Pure player foot RDC — Linafoot + Léopards.",
  },
  {
    id: "linafoot-official",
    source: "LINAFOOT (officiel)",
    rssUrl: "https://linafoot.cd/feed/",
    siteUrl: "https://linafoot.cd",
    country: "CD",
    leagueSlug: "linafoot-rdc",
    championshipName: "LINAFOOT (RDC)",
    reliability: 2,
    cms: "wordpress",
    note: "Site officiel de la ligue — stale (dernier post mai 2025).",
  },
  {
    id: "sportrdc-main",
    source: "Sport RDC",
    rssUrl: "https://sportrdc.com/feed/",
    siteUrl: "https://sportrdc.com",
    country: "CD",
    leagueSlug: "linafoot-rdc",
    championshipName: "LINAFOOT (RDC)",
    reliability: 3,
    cms: "wordpress",
    note: "Sport RDC (foot dominant) — stale (dernier post sept 2025).",
  },

  // ─── Burkina Faso — Fasofoot ────────────────────────────────────────────
  {
    id: "226foot-main",
    source: "226Foot",
    rssUrl: "https://226foot.com/feed/",
    siteUrl: "https://226foot.com",
    country: "BF",
    leagueSlug: "fasofoot-burkina-faso",
    championshipName: "Fasofoot (Burkina Faso)",
    reliability: 1,
    cms: "wordpress",
    note: "Dédié foot burkinabè — couvre Fasofoot + joueurs locaux.",
  },
  {
    id: "fasozine-main",
    source: "FasoZine",
    rssUrl: "https://fasozine.com/feed/",
    siteUrl: "https://fasozine.com",
    country: "BF",
    leagueSlug: "fasofoot-burkina-faso",
    championshipName: "Fasofoot (Burkina Faso)",
    reliability: 2,
    cms: "wordpress",
    note: "Pure player foot BF (mais publie aussi streaming Europe — filtre champ/clubs fait le tri).",
  },
  {
    id: "fbf-official-burkina",
    source: "Fédération Burkinabè de Football",
    rssUrl: "https://fbf.bf/feed/",
    siteUrl: "https://fbf.bf",
    country: "BF",
    leagueSlug: "fasofoot-burkina-faso",
    championshipName: "Fasofoot (Burkina Faso)",
    reliability: 1,
    cms: "wordpress",
    note: "Fédération officielle.",
  },

  // ─── Mali — Primus Ligue ────────────────────────────────────────────────
  // Écosystème médias foot ML fragile : bamada/sports catégorie spécialisée sport.
  {
    id: "bamada-sports",
    source: "Bamada Sports",
    rssUrl: "https://bamada.net/category/sports/feed",
    siteUrl: "https://bamada.net",
    country: "ML",
    leagueSlug: "primus-ligue-mali",
    championshipName: "Primus Ligue (Mali)",
    reliability: 2,
    cms: "wordpress",
    note: "Flux catégorie sport (foot dominant) — seule source ML active confirmée.",
  },
  {
    id: "journaldumali-sport",
    source: "Journal du Mali — Sport",
    rssUrl: "https://journaldumali.com/category/sport/feed/",
    siteUrl: "https://journaldumali.com/category/sport",
    country: "ML",
    leagueSlug: "primus-ligue-mali",
    championshipName: "Primus Ligue (Mali)",
    reliability: 2,
    cms: "wordpress",
    note: "Catégorie sport 100% Mali (foot dominant Aigles + Stade/Djoliba) — fallback média sport pays.",
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Filtre strict : uniquement championnat domestique + équipes seniors masculines
// ──────────────────────────────────────────────────────────────────────────────

/** Mots-clés qui disqualifient immédiatement un article */
const EXCLUDE_KEYWORDS = [
  // Féminin
  "féminin",
  "feminin",
  "féminine",
  "feminine",
  "féminines",
  "dames",
  "amazones",
  "lionnes",
  "fennecs dames",
  "étalons dames",
  "women",
  "ladies",
  "girls",

  // Catégories jeunes
  " u15",
  " u-15",
  " u17",
  " u-17",
  " u19",
  " u-19",
  " u20",
  " u-20",
  " u23",
  " u-23",
  "moins de 15",
  "moins de 17",
  "moins de 19",
  "moins de 20",
  "moins de 23",
  "cadet",
  "cadette",
  "junior ",
  "juniors",
  "jeune",
  "minime",
  "scolaire",
  "collège",
  "universit",

  // Compétitions jeunes/féminines spécifiques
  "can u17",
  "can u20",
  "can u23",
  "can scolaire",
  "mondial u17",
  "mondial u20",
  "coupe du monde u17",
  "coupe du monde u20",
  "coupe du monde féminine",
  "coupe du monde feminine",
  "cdm féminin",

  // Futsal / beach / autres disciplines
  "futsal",
  "beach soccer",
  "basket",
  "handball",
  "volley",
  "athlétisme",
  "athletisme",
  "lutte",
  "judo",
  "tennis",
  "cyclisme",
];

/**
 * Mots-clés qui confirment qu'on parle du championnat ou de clubs seniors masculins.
 * Au moins UN doit être présent pour garder l'article.
 */
const INCLUDE_KEYWORDS = [
  // Championnat générique
  "championnat",
  "championat",
  "ligue 1",
  "ligue1",
  "ligue pro",
  "elite one",
  "premier league",
  "botola",
  "linafoot",
  "mtn ligue 1",
  "celtiis ligue 1",
  "fasofoot",
  "primus ligue",

  // Structure compétitive
  "journée",
  "journee",
  " j1 ",
  " j2 ",
  " j3 ",
  " j4 ",
  " j5 ",
  " j6 ",
  " j7 ",
  " j8 ",
  " j9 ",
  " j10",
  " j11",
  " j12",
  " j13",
  " j14",
  " j15",
  " j16",
  " j17",
  " j18",
  " j19",
  " j20",
  " j21",
  " j22",
  " j23",
  " j24",
  " j25",
  " j26",
  "matchday",
  "classement",
  "play-off",
  "play off",
  "playoff",

  // Compétitions africaines clubs seniors
  "caf champions",
  "coupe caf",
  "ligue des champions caf",
  "coupe de la confédération",
  "coupe du cameroun",
  "coupe du sénégal",
  "coupe de côte d'ivoire",
  "coupe du mali",
  "coupe du bénin",
  "coupe du burkina",
  "coupe du trône",
  "coupe du trone",

  // Signalements clubs pros (se complète dynamiquement depuis la table teams)
  "club",
  "équipe première",
  "equipe premiere",
  "entraîneur",
  "entraineur",
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ");
}

/**
 * Retourne true si l'article concerne un championnat domestique ou une équipe
 * senior masculine.
 *
 * @param input.title, input.summary — texte de l'article RSS
 * @param input.knownClubs — noms des clubs seniors du championnat (chargés
 *   depuis `teams` filtré par league_id). Si un nom est cité, on garde.
 * @param input.nationalityMarker — adjectif national court (ex: "burkinab",
 *   "béninois", "ivoirien"…). Si présent + pas de mot-clé d'exclusion, on garde.
 */
export function isSeniorMenChampionshipArticle(input: {
  title: string;
  summary?: string;
  knownClubs?: string[];
  nationalityMarker?: string;
}): { keep: boolean; reason: string } {
  const blob = normalize(`${input.title} ${input.summary || ""}`);

  // 1. Exclusion dure (féminin, jeunes, autres disciplines) — priorité absolue
  for (const kw of EXCLUDE_KEYWORDS) {
    if (blob.includes(kw)) {
      return { keep: false, reason: `exclu: "${kw.trim()}"` };
    }
  }

  // 2. Match sur nom de club connu du championnat (chargé dynamiquement)
  if (input.knownClubs?.length) {
    for (const club of input.knownClubs) {
      if (!club) continue;
      const clubNorm = normalize(club);
      // Ignorer les noms < 4 caractères (trop de faux positifs : "asec" OK, "us" pas OK)
      if (clubNorm.length < 4) continue;
      if (blob.includes(clubNorm)) {
        return { keep: true, reason: `club: "${club}"` };
      }
    }
  }

  // 3. Inclusion par mots-clés championnat (ligue 1, botola, journée, …)
  for (const kw of INCLUDE_KEYWORDS) {
    if (blob.includes(kw)) {
      return { keep: true, reason: `match: "${kw.trim()}"` };
    }
  }

  // 4. Adjectif national + contexte foot pro — rattrape les titres "transfert
  //    d'un joueur ivoirien", "sacre burkinabè", etc.
  if (input.nationalityMarker) {
    const natNorm = normalize(input.nationalityMarker);
    if (blob.includes(natNorm)) {
      // On exige au moins un mot "pro" pour éviter les articles amateurs/autres
      const proContext = [
        "champion",
        "titre",
        "sacre",
        "sacré",
        "transfert",
        "signature",
        "signe",
        "joueur",
        "club",
        "équipe",
        "equipe",
        "coach",
        "entraîneur",
        "entraineur",
        "sélection",
        "selection",
        "convocation",
        "fédération",
        "federation",
      ];
      if (proContext.some((w) => blob.includes(w))) {
        return { keep: true, reason: `national: "${natNorm}" + contexte pro` };
      }
    }
  }

  // 5. Ambiguïté : exclure par défaut pour rester strict
  return {
    keep: false,
    reason: "aucun indicateur championnat senior masculin",
  };
}

/**
 * Adjectif national court à fournir au filtre pour chaque code pays.
 * On utilise la racine (pas le suffixe complet) pour matcher les variantes
 * masculin/féminin/pluriel : "burkinab" → burkinabè, burkinabé, burkinabés…
 */
export const COUNTRY_NATIONAL_MARKER: Record<string, string> = {
  BJ: "béninois",
  SN: "sénégalais",
  CI: "ivoirien",
  CM: "camerounais",
  TN: "tunisien",
  MA: "marocain",
  CD: "congolais",
  BF: "burkinab",
  ML: "malien",
  DZ: "algérien",
  GA: "gabonais",
  TG: "togolais",
  NE: "nigérien",
};
