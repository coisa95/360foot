export const systemPrompt = `Tu es le rédacteur sportif de 360 Foot, un média d'actualité football africain francophone. Tu rédiges des récapitulatifs (daily ou weekly) qui synthétisent l'essentiel de l'actualité football.

Règles :
- Rédige en français uniquement.
- Le récapitulatif doit faire entre 400 et 600 mots.
- Résume les résultats clés de la période (journée ou semaine).
- Analyse l'impact sur les classements.
- Mets en avant les meilleurs performeurs (buteurs, passeurs, clean sheets).
- Adopte un ton dynamique et informatif.
- IMPORTANT : Le champ "content" doit être en HTML pur (balises <p>, <h2>, <h3>, <strong>, <ul>, <li>). N'utilise JAMAIS de markdown (#, *, **, ##). Pas de balises <h1>.
- Le champ "excerpt" doit être du texte brut sans aucun formatage.
- Retourne le résultat au format JSON avec les champs suivants : title, content, excerpt, seo_title, seo_description, tags.`;

export interface RecapMatchEvent {
  type: string;
  player: string;
  team: string;
  minute: number;
}

export interface RecapMatchResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  competition: string;
  date: string;
  events: RecapMatchEvent[];
  keyMoment?: string;
}

export interface StandingsEntry {
  position: number;
  team: string;
  points: number;
  played: number;
}

export interface TopPerformer {
  name: string;
  team: string;
  stat: string;
  value: number;
}

export interface RecapData {
  period: string;
  periodType: "daily" | "weekly";
  competition: string;
  matchday?: string | number;
  matches: RecapMatchResult[];
  standings?: StandingsEntry[];
  topPerformers?: TopPerformer[];
}

export function buildUserPrompt(data: RecapData): string {
  const periodLabel = data.periodType === "daily" ? "la journée" : "la semaine";

  const matchLines = data.matches
    .map((m) => {
      const scorers = m.events
        .filter((e) => e.type === "goal")
        .map((e) => `${e.player} (${e.minute}')`)
        .join(", ");
      let line = `  - ${m.homeTeam} ${m.homeScore}-${m.awayScore} ${m.awayTeam}`;
      if (scorers) line += ` | Buts : ${scorers}`;
      if (m.keyMoment) line += ` | Fait marquant : ${m.keyMoment}`;
      return line;
    })
    .join("\n");

  let prompt = `Rédige un récapitulatif de ${periodLabel} avec les informations suivantes :

Période : ${data.period}
Compétition : ${data.competition}${data.matchday ? ` - Journée ${data.matchday}` : ""}

Résultats :
${matchLines}`;

  if (data.standings?.length) {
    const standingsLines = data.standings
      .map((s) => `  ${s.position}. ${s.team} - ${s.points} pts (${s.played} matchs)`)
      .join("\n");
    prompt += `\n\nClassement mis à jour :
${standingsLines}`;
  }

  if (data.topPerformers?.length) {
    const perfLines = data.topPerformers
      .map((p) => `  - ${p.name} (${p.team}) : ${p.value} ${p.stat}`)
      .join("\n");
    prompt += `\n\nMeilleurs performeurs :
${perfLines}`;
  }

  prompt += `\n\nRetourne le résultat en JSON avec les champs : title, content, excerpt, seo_title, seo_description, tags.`;

  return prompt;
}
