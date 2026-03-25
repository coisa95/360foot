export const systemPrompt = `Tu es le rédacteur sportif de 360 Foot. Tu rédiges des previews d'avant-match qui donnent envie de suivre le match et de parier.

Règles :
- Rédige en français uniquement.
- La preview doit faire entre 300 et 500 mots.
- Analyse la forme récente des deux équipes (5 derniers matchs).
- Mentionne les absences connues et les compositions probables.
- Intègre l'historique des confrontations directes (head-to-head).
- Propose un pronostic clair et argumenté.
- Adopte un ton engageant qui donne envie de suivre le match.
- Retourne le résultat au format JSON avec les champs suivants : title, content, excerpt, seo_title, seo_description, tags.`;

export interface RecentFormMatch {
  opponent: string;
  result: "W" | "D" | "L";
  score: string;
  competition?: string;
}

export interface HeadToHeadRecord {
  date: string;
  homeTeam: string;
  awayTeam: string;
  score: string;
  competition?: string;
}

export interface StandingsEntry {
  position: number;
  team: string;
  points: number;
  played: number;
}

export interface PreviewMatchData {
  homeTeam: string;
  awayTeam: string;
  competition: string;
  matchday?: string | number;
  date: string;
  kickoff?: string;
  venue?: string;
  homeForm: RecentFormMatch[];
  awayForm: RecentFormMatch[];
  headToHead: HeadToHeadRecord[];
  standings: StandingsEntry[];
  homeAbsences?: string[];
  awayAbsences?: string[];
  homeProbableLineup?: string[];
  awayProbableLineup?: string[];
}

export function buildUserPrompt(data: PreviewMatchData): string {
  const formatForm = (form: RecentFormMatch[]) =>
    form
      .map((m) => `  - ${m.result} ${m.score} vs ${m.opponent}${m.competition ? ` (${m.competition})` : ""}`)
      .join("\n");

  const h2hLines = data.headToHead
    .map((m) => `  - ${m.date} : ${m.homeTeam} ${m.score} ${m.awayTeam}${m.competition ? ` (${m.competition})` : ""}`)
    .join("\n");

  const standingsLines = data.standings
    .map((s) => `  ${s.position}. ${s.team} - ${s.points} pts (${s.played} matchs)`)
    .join("\n");

  let prompt = `Rédige une preview d'avant-match avec les informations suivantes :

Compétition : ${data.competition}${data.matchday ? ` - Journée ${data.matchday}` : ""}
Date : ${data.date}${data.kickoff ? ` à ${data.kickoff}` : ""}
${data.venue ? `Stade : ${data.venue}\n` : ""}
${data.homeTeam} vs ${data.awayTeam}

Forme récente de ${data.homeTeam} (5 derniers matchs) :
${formatForm(data.homeForm)}

Forme récente de ${data.awayTeam} (5 derniers matchs) :
${formatForm(data.awayForm)}

Confrontations directes :
${h2hLines || "  Aucune confrontation récente disponible"}

Classement actuel :
${standingsLines}`;

  if (data.homeAbsences?.length || data.awayAbsences?.length) {
    prompt += `\n\nAbsences :`;
    if (data.homeAbsences?.length) prompt += `\n  ${data.homeTeam} : ${data.homeAbsences.join(", ")}`;
    if (data.awayAbsences?.length) prompt += `\n  ${data.awayTeam} : ${data.awayAbsences.join(", ")}`;
  }

  if (data.homeProbableLineup?.length || data.awayProbableLineup?.length) {
    prompt += `\n\nCompositions probables :`;
    if (data.homeProbableLineup?.length) prompt += `\n  ${data.homeTeam} : ${data.homeProbableLineup.join(", ")}`;
    if (data.awayProbableLineup?.length) prompt += `\n  ${data.awayTeam} : ${data.awayProbableLineup.join(", ")}`;
  }

  prompt += `\n\nRetourne le résultat en JSON avec les champs : title, content, excerpt, seo_title, seo_description, tags.`;

  return prompt;
}
