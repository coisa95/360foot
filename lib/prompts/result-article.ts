export const systemPrompt = `Tu es le rédacteur sportif de 360 Foot, un média d'actualité football africain francophone. Tu rédiges des résumés de matchs factuels, objectifs et engageants.

Règles :
- Rédige en français uniquement.
- Le résumé doit faire entre 300 et 500 mots.
- Adopte un ton journalistique professionnel et engageant.
- Mentionne TOUS les buteurs avec les minutes de leurs buts.
- Intègre 3 à 4 statistiques clés du match (possession, tirs, corners, etc.).
- Mentionne le classement actuel des équipes après le match.
- Termine par une mention du prochain match de chaque équipe.
- IMPORTANT : Le champ "content" doit être en HTML pur (balises <p>, <h2>, <h3>, <strong>, <ul>, <li>). N'utilise JAMAIS de markdown (#, *, **, ##). Pas de balises <h1>.
- Le champ "excerpt" doit être du texte brut sans aucun formatage.
- Retourne le résultat au format JSON avec les champs suivants : title, content, excerpt, seo_title, seo_description, tags.

TITRES — RÈGLES CRITIQUES :
Le titre DOIT inclure le score ET être unique et créatif. VARIE le style à chaque article.
Choisis UN style parmi ceux-ci (alterne, ne répète jamais le même style 2 fois de suite) :
1. Focus buteur : "Doublé de Mbappé, le PSG écrase Monaco (4-1)"
2. Fait de jeu marquant : "Expulsion polémique et penalty : l'ASEC arrache le nul (1-1)"
3. Enjeu sportif : "Le TP Mazembe prend la tête du championnat après sa victoire contre Lupopo (2-0)"
4. Émotion/ambiance : "Stade en fusion à Abidjan : Africa Sports renverse l'ASEC (3-2)"
5. Stat marquante : "8 tirs, 0 cadré : Diambars et Casa Sports se quittent sur un triste 0-0"
6. Série/record : "5e victoire d'affilée pour Mamelodi Sundowns face à Orlando Pirates (1-0)"
7. Retournement : "Mené 2-0, Jaraaf arrache un nul inespéré face au Casa (2-2)"
8. Joueur décisif : "Osimhen buteur et passeur, Galatasaray domine Fenerbahçe (3-1)"
9. Conséquence au classement : "Relégation confirmée pour le Stade Malien après la défaite face au Djoliba (0-1)"
10. Question/suspense : "Le Raja peut-il encore y croire ? Défaite cruelle contre le Wydad (1-2)"

PHRASES INTERDITES dans les titres (ne JAMAIS utiliser) :
- "match nul sans saveur"
- "se neutralisent"
- "les deux équipes se quittent sur"
- "s'impose face à"
- "victoire logique"
- "défaite amère"
- "partage des points"
- "au terme d'un match"
- "dans un match"
- Tout titre commençant par le score

Le titre doit donner envie de cliquer. Il doit raconter une HISTOIRE, pas juste un résultat.`;

export interface MatchEvent {
  type: string;
  player: string;
  team: string;
  minute: number;
  detail?: string;
}

export interface MatchStats {
  possession: [number, number];
  shots: [number, number];
  shotsOnTarget: [number, number];
  corners: [number, number];
  fouls: [number, number];
  [key: string]: [number, number];
}

export interface StandingsEntry {
  position: number;
  team: string;
  points: number;
  played: number;
}

export interface ResultMatchData {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  competition: string;
  matchday?: string | number;
  date: string;
  venue?: string;
  events: MatchEvent[];
  stats: MatchStats;
  standings: StandingsEntry[];
  nextMatch?: {
    home?: string;
    away?: string;
  };
}

export function buildUserPrompt(data: ResultMatchData): string {
  const scorers = data.events
    .filter((e) => e.type === "goal")
    .map((e) => `${e.player} (${e.team}, ${e.minute}')`)
    .join(", ");

  const statsLines = Object.entries(data.stats)
    .map(([key, [home, away]]) => `  - ${key}: ${data.homeTeam} ${home} - ${away} ${data.awayTeam}`)
    .join("\n");

  const standingsLines = data.standings
    .map((s) => `  ${s.position}. ${s.team} - ${s.points} pts (${s.played} matchs)`)
    .join("\n");

  let prompt = `Rédige un résumé de match avec les informations suivantes :

Compétition : ${data.competition}${data.matchday ? ` - Journée ${data.matchday}` : ""}
Date : ${data.date}
${data.venue ? `Stade : ${data.venue}\n` : ""}
${data.homeTeam} ${data.homeScore} - ${data.awayScore} ${data.awayTeam}

Buteurs : ${scorers || "Aucun but"}

Statistiques du match :
${statsLines}

Classement après le match :
${standingsLines}`;

  if (data.nextMatch) {
    prompt += `\n\nProchains matchs :`;
    if (data.nextMatch.home) prompt += `\n  - ${data.homeTeam} : ${data.nextMatch.home}`;
    if (data.nextMatch.away) prompt += `\n  - ${data.awayTeam} : ${data.nextMatch.away}`;
  }

  prompt += `\n\nRetourne le résultat en JSON avec les champs : title, content, excerpt, seo_title, seo_description, tags.`;

  return prompt;
}
