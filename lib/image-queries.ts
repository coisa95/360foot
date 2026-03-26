export interface ArticleImageInput {
  title: string;
  teams: string[];
  league: string;
  competition?: string;
  type: string;
  tags: string[];
}

// Map well-known club/country names to better Pexels search terms
const CONTEXT_KEYWORDS: Record<string, string[]> = {
  // Clubs
  "Real Madrid": ["Real Madrid stadium Santiago Bernabeu", "spanish football white jersey"],
  "Barcelona": ["Barcelona football camp nou", "spanish football red blue jersey"],
  "FC Barcelone": ["Barcelona football camp nou", "spanish football red blue jersey"],
  "PSG": ["Paris football Eiffel tower night", "french football stadium"],
  "Liverpool": ["Liverpool football Anfield stadium", "english football red jersey"],
  "Manchester": ["Manchester football Old Trafford", "english football stadium"],
  "Bayern": ["Bayern Munich football Allianz Arena", "german football red jersey"],
  "Juventus": ["Juventus football Turin stadium", "italian football black white jersey"],
  "Al-Nassr": ["Saudi Arabia football stadium night", "middle east football golden"],
  "Al Nassr": ["Saudi Arabia football stadium night", "middle east football golden"],
  "Napoli": ["Naples football stadium", "italian football blue jersey"],
  "Naples": ["Naples football stadium", "italian football blue jersey"],
  "Chelsea": ["Chelsea football Stamford Bridge London", "english football blue jersey"],
  "Arsenal": ["Arsenal football Emirates stadium", "english football red jersey"],
  "Milan": ["AC Milan football San Siro stadium", "italian football red black jersey"],
  "Inter": ["Inter Milan football San Siro", "italian football blue black jersey"],
  "Galatasaray": ["Turkish football Istanbul stadium", "turkish football red yellow"],
  // Countries
  "France": ["France football blue jersey national team", "french football Stade de France"],
  "Brésil": ["Brazil football yellow jersey Maracana", "brazilian football samba"],
  "Brazil": ["Brazil football yellow jersey Maracana", "brazilian football samba"],
  "Sénégal": ["Senegal african football green jersey", "african football fans celebration"],
  "Nigeria": ["Nigeria football green white jersey", "african football fans"],
  "Cameroun": ["Cameroon football green jersey african", "african football stadium"],
  "Kenya": ["Kenya african football stadium Nairobi", "east african football"],
  "Côte d'Ivoire": ["Ivory Coast football orange jersey", "african football Abidjan"],
  "Espagne": ["Spain football red jersey", "spanish football La Roja"],
  "Portugal": ["Portugal football red jersey", "portuguese football stadium"],
  "Allemagne": ["Germany football white jersey", "german football stadium"],
  "Angleterre": ["England football Wembley stadium", "english football Three Lions"],
  "Argentine": ["Argentina football blue white jersey", "argentinian football fans"],
};

export function generateImageQueries(input: ArticleImageInput): string[] {
  const queries: string[] = [];

  // Priority 0: Context-specific queries based on tags and teams
  const allTerms = [...input.teams, ...input.tags, input.title];
  const matchedContexts = new Set<string>();

  for (const term of allTerms) {
    for (const [keyword, contextQueries] of Object.entries(CONTEXT_KEYWORDS)) {
      if (term.toLowerCase().includes(keyword.toLowerCase()) && !matchedContexts.has(keyword)) {
        matchedContexts.add(keyword);
        queries.push(...contextQueries);
      }
    }
  }

  // Priority 1: Type-specific queries
  if (input.type === "player_profile") {
    // For player profiles, search for their club/country context
    queries.push("football player training session close up");
    queries.push("football player celebration goal stadium");
    queries.push("soccer player action dribble");
  }

  if (input.type === "result" || input.type === "preview") {
    queries.push("football match stadium crowd");
    queries.push("soccer game atmosphere night");
    queries.push("football crowd celebration fans");
  }

  if (input.type === "transfer") {
    queries.push("football player portrait jersey");
    queries.push("soccer training session");
    queries.push("football player signing contract");
  }

  if (input.type === "recap") {
    queries.push("football stadium night lights");
    queries.push("soccer trophy celebration team");
    queries.push("football highlights action");
  }

  // Priority 2: Competition-specific
  if (
    input.competition?.includes("CAN") ||
    input.competition?.includes("Africa") ||
    input.league?.includes("Côte d'Ivoire") ||
    input.league?.includes("Sénégal") ||
    input.league?.includes("Cameroun") ||
    input.league?.includes("Mali") ||
    input.league?.includes("Burkina")
  ) {
    queries.push("african football fans celebration");
    queries.push("africa stadium soccer crowd");
  }

  if (input.league?.includes("Premier League")) {
    queries.push("english football stadium Premier League");
  }

  if (input.league?.includes("Ligue 1") && !input.league?.includes("Côte")) {
    queries.push("french football stadium Ligue 1");
  }

  if (input.league?.includes("La Liga")) {
    queries.push("spanish football stadium La Liga");
  }

  if (input.league?.includes("Serie A")) {
    queries.push("italian football stadium Serie A");
  }

  if (input.league?.includes("Bundesliga")) {
    queries.push("german football stadium Bundesliga");
  }

  if (input.league?.includes("Champions League")) {
    queries.push("champions league football night trophy");
  }

  if (input.league?.includes("MLS")) {
    queries.push("american soccer stadium MLS");
  }

  if (input.league?.includes("Saudi")) {
    queries.push("Saudi Arabia football stadium night");
  }

  // Priority 3: Coupe du monde
  if (input.title?.includes("Coupe du monde") || input.tags?.some(t => t.includes("Coupe du monde"))) {
    queries.push("FIFA World Cup football stadium");
    queries.push("World Cup trophy football celebration");
  }

  // Priority 4: Generic high-quality fallbacks
  queries.push("football soccer action close up");
  queries.push("soccer ball green pitch stadium");

  // Deduplicate
  return Array.from(new Set(queries));
}
