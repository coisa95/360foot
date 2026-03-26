import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getMatchesByRange } from "@/lib/api-football";

const LEAGUE_IDS = [
  // Ligues africaines
  386, // Ligue 1 Côte d'Ivoire
  403, // Ligue 1 Sénégal
  411, // Elite One Cameroun
  598, // Première Division Mali
  423, // Ligue 1 Burkina Faso
  // Ligues européennes
  61,  // Ligue 1 France
  39,  // Premier League
  140, // La Liga
  135, // Serie A
  78,  // Bundesliga
  // Autres ligues majeures
  253, // MLS (USA)
  307, // Saudi Pro League
  // Compétitions continentales & internationales
  2,   // Champions League
  3,   // Europa League
  848, // Conference League
  6,   // CAN
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

    // Get matches from the last 7 days + next 7 days
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - 7);
    const to = new Date(now);
    to.setDate(to.getDate() + 7);
    const fromStr = from.toISOString().split("T")[0];
    const toStr = to.toISOString().split("T")[0];

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

    for (let i = 0; i < LEAGUE_IDS.length; i++) {
      const leagueId = LEAGUE_IDS[i];

      // Respect rate limit: 10 requests/min → wait 7s between calls
      if (i > 0) await delay(7000);
      try {
        const matches = await getMatchesByRange(fromStr, toStr, leagueId);

        if (!matches || matches.length === 0) continue;

        const leagueUUID = leagueMap.get(leagueId);

        for (const match of matches) {
          // Filtrer les matchs de catégories jeunes
          const leagueName = match.league?.name || "";
          const homeTeamName = match.teams?.home?.name || "";
          const awayTeamName = match.teams?.away?.name || "";
          const fullText = `${leagueName} ${homeTeamName} ${awayTeamName}`;
          const fullTextLower = fullText.toLowerCase();
          const isYouth = YOUTH_KEYWORDS.some(
            (kw) => fullTextLower.includes(kw.toLowerCase())
          );
          if (isYouth) continue;

          // Filtrer les équipes hors périmètre (faux positifs API-Football)
          const isExcluded = EXCLUDED_TEAM_KEYWORDS.some(
            (kw) => homeTeamName.includes(kw) || awayTeamName.includes(kw)
          );
          if (isExcluded) {
            console.log(`Match exclu (hors périmètre): ${homeTeamName} vs ${awayTeamName}`);
            continue;
          }

          // Pour les matchs amicaux et qualifs, filtrer par pays d'intérêt
          const FRIENDLY_LEAGUE_IDS = [10, 32, 34, 29]; // Amicaux, Qualifs Europe, Amérique du Sud, Afrique
          if (FRIENDLY_LEAGUE_IDS.includes(leagueId)) {
            const isRelevant = RELEVANT_COUNTRIES.some(
              (country) =>
                homeTeamName.toLowerCase().includes(country.toLowerCase()) ||
                awayTeamName.toLowerCase().includes(country.toLowerCase())
            );
            if (!isRelevant) continue;
          }

          const homeTeam = match.teams.home;
          const awayTeam = match.teams.away;

          // Upsert teams
          const teamsToUpsert = [
            {
              api_football_id: homeTeam.id,
              name: homeTeam.name,
              slug: homeTeam.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, ""),
              logo_url: homeTeam.logo,
              league_id: leagueUUID || null,
            },
            {
              api_football_id: awayTeam.id,
              name: awayTeam.name,
              slug: awayTeam.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, ""),
              logo_url: awayTeam.logo,
              league_id: leagueUUID || null,
            },
          ];

          const { error: teamError } = await supabase
            .from("teams")
            .upsert(teamsToUpsert, { onConflict: "api_football_id" });

          if (teamError) {
            errors.push(`Team upsert: ${teamError.message}`);
          } else {
            totalTeamsUpserted += teamsToUpsert.length;
          }

          // Get team UUIDs from DB
          const { data: homeTeamRow } = await supabase
            .from("teams")
            .select("id")
            .eq("api_football_id", homeTeam.id)
            .single();

          const { data: awayTeamRow } = await supabase
            .from("teams")
            .select("id")
            .eq("api_football_id", awayTeam.id)
            .single();

          const matchDate = match.fixture.date.split("T")[0];
          const slug = generateSlug(homeTeam.name, awayTeam.name, matchDate);

          // Upsert match with correct schema columns
          const matchData = {
            api_football_id: match.fixture.id,
            home_team_id: homeTeamRow?.id || null,
            away_team_id: awayTeamRow?.id || null,
            league_id: leagueUUID || null,
            slug,
            date: match.fixture.date,
            status: match.fixture.status.short,
            score_home: match.goals.home,
            score_away: match.goals.away,
            stats_json: match,
          };

          const { error: matchError } = await supabase
            .from("matches")
            .upsert(matchData, { onConflict: "api_football_id" });

          if (matchError) {
            errors.push(`Match ${slug}: ${matchError.message}`);
          } else {
            totalMatches++;
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
      date_range: `${fromStr} to ${toStr}`,
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
