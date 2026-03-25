export interface ArticleImageInput {
  title: string;
  teams: string[];
  league: string;
  competition?: string;
  type: string;
  tags: string[];
}

export function generateImageQueries(input: ArticleImageInput): string[] {
  const queries: string[] = [];

  // Priority 1: Type-specific queries
  if (input.type === "result" || input.type === "preview") {
    queries.push("football match stadium");
    queries.push("soccer game atmosphere");
    queries.push("football crowd celebration");
  }

  if (input.type === "transfer") {
    queries.push("football player portrait");
    queries.push("soccer training session");
    queries.push("football jersey");
  }

  if (input.type === "recap") {
    queries.push("football stadium night");
    queries.push("soccer trophy celebration");
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
    queries.push("african football fans");
    queries.push("africa stadium soccer");
  }

  if (input.league?.includes("Premier League")) {
    queries.push("english football stadium");
  }

  if (input.league?.includes("Ligue 1") && !input.league?.includes("Côte")) {
    queries.push("french football stadium");
  }

  if (input.league?.includes("La Liga")) {
    queries.push("spanish football stadium");
  }

  if (input.league?.includes("Serie A")) {
    queries.push("italian football stadium");
  }

  if (input.league?.includes("Bundesliga")) {
    queries.push("german football stadium");
  }

  if (input.league?.includes("Champions League")) {
    queries.push("champions league football night");
  }

  if (input.league?.includes("MLS")) {
    queries.push("american soccer stadium");
  }

  if (input.league?.includes("Saudi")) {
    queries.push("middle east football stadium");
  }

  // Priority 3: Generic high-quality fallbacks
  queries.push("football soccer action");
  queries.push("soccer ball green pitch");

  return queries;
}
