import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getMatchesByRange, getCurrentSeason } from "@/lib/api-football";

export const maxDuration = 300;

const LEAGUE_IDS = [
  // Ligues africaines
  386, // Ligue 1 Côte d'Ivoire
  403, // Ligue 1 Sénégal
  411, // Elite One Cameroun
  598, // Première Division Mali
  423, // Ligue 1 Burkina Faso
  415, // Championnat National Bénin
  424, // Linafoot Ligue 1 RD Congo
  378, // Ligue 1 Guinée
  968, // Championnat D1 Gabon
  // Ligues européennes
  61,  // Ligue 1 France
  39,  // Premier League
  140, // La Liga
  135, // Serie A
  78,  // Bundesliga
  // Autres ligues majeures
  253, // MLS (USA)
  307, // Saudi Pro League
  // Compétitions continentales (clubs)
  2,   // Champions League (UEFA)
  3,   // Europa League (UEFA)
  848, // Conference League (UEFA)
  12,  // CAF Champions League
  20,  // CAF Confederation Cup
  17,  // AFC Champions League
  18,  // AFC Cup
  16,  // CONCACAF Champions League
  767, // CONCACAF League
  13,  // Copa Libertadores
  11,  // Copa Sudamericana
  // Compétitions internationales (sélections)
  6,   // CAN
  4,   // Euro
  9,   // Copa America
  7,   // Coupe d'Asie (Asian Cup)
  22,  // CONCACAF Gold Cup
  29,  // Qualifs Coupe du Monde - Afrique
  32,  // Qualifs Coupe du Monde - Europe
  34,  // Qualifs Coupe du Monde - Amérique du Sud
  10,  // Matchs amicaux internationaux
];

// Filtrer les compétitions jeunes et non pertinentes
const YOUTH_KEYWORDS = ["U23", "U21", "U20", "U19", "U18", "U17", "Youth", "Junior", "Espoirs", "Olympic", "Women", "Féminin", "u23", "u21", "u20", "u19", "u18", "u17", "women", "féminin"];

// Clubs/ligues à exclure (faux positifs API-Football)
const EXCLUDED_TEAM_KEYWORDS = [
  "Hapoel", "Maccabi", "Beitar", "Bnei", "Ironi", "Shimshon",   // Israël
  "Persepolis", "Esteghlal", "Sepahan",                          // Iran
  "Mohun Bagan", "Kerala", "Chennaiyin",                         // Inde
  "Buriram", "Muangthong",                                       // Thaïlande
];

// Pays/équipes d'intérêt pour les matchs amicaux et qualifs
const RELEVANT_COUNTRIES = [
  // Afrique
  "Ivory Coast", "Cote D'Ivoire", "Côte d'Ivoire", "Senegal", "Sénégal", "Cameroon", "Cameroun",
  "Mali", "Burkina Faso", "Ghana", "Nigeria", "Egypt", "Morocco", "Maroc", "Algeria", "Algérie",
  "Tunisia", "Tunisie", "Guinea", "Guinée", "Congo", "DR Congo", "Gabon", "Benin", "Bénin", "Togo",
  "South Africa", "Afrique du Sud",
  // Europe (grandes équipes)
  "France", "England", "Germany", "Spain", "Italy", "Portugal", "Netherlands", "Belgium",
  "Brazil", "Brésil", "Argentina", "Argentine", "Colombia", "Colombie", "Uruguay",
  // Autres grosses nations
  "Mexico", "Mexique", "USA", "United States", "Japan", "Japon",
  "Croatia", "Croatie", "Turkey", "Turquie", "Switzerland", "Suisse",
  "Denmark", "Danemark", "Austria", "Autriche", "Poland", "Pologne",
  "Sweden", "Suède", "Norway", "Norvège", "Czech Republic", "République Tchèque",
  "Scotland", "Wales", "Ukraine", "Serbia", "Serbie", "Greece", "Grèce",
  "Romania", "Roumanie", "Hungary", "Hongrie", "Slovakia", "Slovaquie",
  "Ireland", "Irlande", "Albania", "Albanie", "Bosnia", "Bosnie",
  "Saudi Arabia", "Arabie Saoudite", "Korea Republic", "Corée du Sud",
];

function generateSlug(home: string, away: string, date: string): string {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  return `${clean(home)}-vs-${clean(away)}-${date}`;
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();

    // Support backfill mode: ?backfill=true fetches full season
    const url = new URL(request.url);
    const isBackfill = url.searchParams.get("backfill") === "true";

    const now = new Date();
    let fromStr: string;
    let toStr: string;

    // Backfill supports ?batch=0,1,2... to process leagues in batches of 7
    const batchParam = url.searchParams.get("batch");
    const batchIndex = batchParam ? parseInt(batchParam, 10) : 0;

    if (isBackfill) {
      // Full season: from July 1 of season year to June 30 next year
      const seasonYear = getCurrentSeason();
      fromStr = `${seasonYear}-07-01`;
      toStr = `${seasonYear + 1}-06-30`;
    } else {
      // Normal mode: last 7 days + next 7 days
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      const to = new Date(now);
      to.setDate(to.getDate() + 7);
      fromStr = from.toISOString().split("T")[0];
      toStr = to.toISOString().split("T")[0];
    }

    // Fetch all league UUID mappings from DB
    const { data: leagues } = await supabase
      .from("leagues")
      .select("id, api_football_id");

    const leagueMap = new Map<number, string>();
    for (const l of leagues || []) {
      if (l.api_football_id) leagueMap.set(l.api_football_id, l.id);
    }

    let totalMatches = 0;
    let totalTeamsUpserted = 0;
    const errors: string[] = [];

    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // In backfill mode, process 1 league per batch (big leagues have 300+ matches)
    const BATCH_SIZE = isBackfill ? 1 : LEAGUE_IDS.length;
    const leaguesToProcess = isBackfill
      ? LEAGUE_IDS.slice(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE)
      : LEAGUE_IDS;

    const FRIENDLY_LEAGUE_IDS = [10, 32, 34, 29];

    for (let i = 0; i < leaguesToProcess.length; i++) {
      const leagueId = leaguesToProcess[i];

      // Respect rate limit: 10 requests/min → wait 7s between calls
      if (i > 0) await delay(7000);
      try {
        const matches = await getMatchesByRange(fromStr, toStr, leagueId);

        if (!matches || matches.length === 0) continue;

        const leagueUUID = leagueMap.get(leagueId);

        // Phase 1: Filter matches and collect all unique teams
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filteredMatches: any[] = [];
        const allTeamsMap = new Map<number, { name: string; logo: string }>();

        for (const match of matches) {
          const leagueName = match.league?.name || "";
          const homeTeamName = match.teams?.home?.name || "";
          const awayTeamName = match.teams?.away?.name || "";
          const fullText = `${leagueName} ${homeTeamName} ${awayTeamName}`;
          const fullTextLower = fullText.toLowerCase();

          if (YOUTH_KEYWORDS.some((kw) => fullTextLower.includes(kw.toLowerCase()))) continue;
          if (EXCLUDED_TEAM_KEYWORDS.some((kw) => homeTeamName.includes(kw) || awayTeamName.includes(kw))) continue;
          if (FRIENDLY_LEAGUE_IDS.includes(leagueId)) {
            const isRelevant = RELEVANT_COUNTRIES.some(
              (country) =>
                homeTeamName.toLowerCase().includes(country.toLowerCase()) ||
                awayTeamName.toLowerCase().includes(country.toLowerCase())
            );
            if (!isRelevant) continue;
          }

          filteredMatches.push(match);
          allTeamsMap.set(match.teams.home.id, { name: match.teams.home.name, logo: match.teams.home.logo });
          allTeamsMap.set(match.teams.away.id, { name: match.teams.away.name, logo: match.teams.away.logo });
        }

        if (filteredMatches.length === 0) continue;

        // Phase 2: Batch upsert all teams at once
        const teamsToUpsert = Array.from(allTeamsMap.entries()).map(([apiId, team]) => ({
          api_football_id: apiId,
          name: team.name,
          slug: team.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
          logo_url: team.logo,
          league_id: leagueUUID || null,
        }));

        // Upsert in chunks of 50 to avoid payload limits
        for (let c = 0; c < teamsToUpsert.length; c += 50) {
          const chunk = teamsToUpsert.slice(c, c + 50);
          const { error: teamError } = await supabase
            .from("teams")
            .upsert(chunk, { onConflict: "api_football_id" });
          if (teamError) errors.push(`Team batch upsert: ${teamError.message}`);
          else totalTeamsUpserted += chunk.length;
        }

        // Phase 3: Batch fetch all team UUIDs at once
        const teamApiIds = Array.from(allTeamsMap.keys());
        const teamUUIDMap = new Map<number, string>();

        for (let c = 0; c < teamApiIds.length; c += 100) {
          const chunk = teamApiIds.slice(c, c + 100);
          const { data: teamRows } = await supabase
            .from("teams")
            .select("id, api_football_id")
            .in("api_football_id", chunk);
          for (const t of teamRows || []) {
            if (t.api_football_id) teamUUIDMap.set(t.api_football_id, t.id);
          }
        }

        // Phase 4: Batch upsert all matches
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const matchDataBatch = filteredMatches.map((match: any) => {
          const matchDate = match.fixture.date.split("T")[0];
          const slug = generateSlug(match.teams.home.name, match.teams.away.name, matchDate);
          return {
            api_football_id: match.fixture.id,
            home_team_id: teamUUIDMap.get(match.teams.home.id) || null,
            away_team_id: teamUUIDMap.get(match.teams.away.id) || null,
            league_id: leagueUUID || null,
            slug,
            date: match.fixture.date,
            status: match.fixture.status.short,
            score_home: match.goals.home,
            score_away: match.goals.away,
            stats_json: match,
          };
        });

        for (let c = 0; c < matchDataBatch.length; c += 50) {
          const chunk = matchDataBatch.slice(c, c + 50);
          const { error: matchError } = await supabase
            .from("matches")
            .upsert(chunk, { onConflict: "api_football_id" });
          if (matchError) {
            errors.push(`Match batch upsert: ${matchError.message}`);
          } else {
            totalMatches += chunk.length;
          }
        }
      } catch (err) {
        errors.push(`League ${leagueId}: ${String(err)}`);
      }
    }

    return NextResponse.json({
      success: true,
      matches_upserted: totalMatches,
      teams_upserted: totalTeamsUpserted,
      leagues_processed: leaguesToProcess.length,
      date_range: `${fromStr} to ${toStr}`,
      ...(isBackfill && { batch: batchIndex, total_batches: LEAGUE_IDS.length }),
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });
  } catch (error) {
    console.error("Error in collect-matches cron:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
