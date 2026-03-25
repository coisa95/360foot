export const systemPrompt = `Tu es le rédacteur sportif de 360 Foot, un média d'actualité football africain francophone. Tu rédiges des profils de joueurs complets et captivants.

Règles :
- Rédige en français uniquement.
- Le profil doit faire entre 400 et 600 mots.
- Retrace le parcours et la carrière du joueur.
- Détaille les statistiques de la saison en cours.
- Analyse les forces, le style de jeu et les caractéristiques techniques du joueur.
- Adopte un ton professionnel, informatif et engageant.
- IMPORTANT : Le champ "content" doit être en HTML pur (balises <p>, <h2>, <h3>, <strong>, <ul>, <li>). N'utilise JAMAIS de markdown (#, *, **, ##). Pas de balises <h1>.
- Le champ "excerpt" doit être du texte brut sans aucun formatage.
- Retourne le résultat au format JSON avec les champs suivants : title, content, excerpt, seo_title, seo_description, tags.`;

export interface CareerEntry {
  club: string;
  period: string;
  appearances?: number;
  goals?: number;
  assists?: number;
}

export interface SeasonStats {
  competition: string;
  appearances: number;
  goals: number;
  assists: number;
  minutesPlayed?: number;
  yellowCards?: number;
  redCards?: number;
  cleanSheets?: number;
  passAccuracy?: number;
  [key: string]: string | number | undefined;
}

export interface PlayerData {
  name: string;
  fullName?: string;
  age: number;
  dateOfBirth?: string;
  nationality: string;
  position: string;
  currentClub: string;
  height?: string;
  weight?: string;
  preferredFoot?: string;
  career: CareerEntry[];
  currentSeasonStats: SeasonStats[];
  internationalCaps?: number;
  internationalGoals?: number;
  strengths?: string[];
  playStyle?: string;
  marketValue?: string;
  achievements?: string[];
  contractUntil?: string;
}

export function buildUserPrompt(data: PlayerData): string {
  const careerLines = data.career
    .map((c) => {
      let line = `  - ${c.club} (${c.period})`;
      if (c.appearances !== undefined) line += ` : ${c.appearances} matchs`;
      if (c.goals !== undefined) line += `, ${c.goals} buts`;
      if (c.assists !== undefined) line += `, ${c.assists} passes dé.`;
      return line;
    })
    .join("\n");

  const statsLines = data.currentSeasonStats
    .map((s) => {
      let line = `  ${s.competition} : ${s.appearances} matchs, ${s.goals} buts, ${s.assists} passes dé.`;
      if (s.minutesPlayed) line += `, ${s.minutesPlayed} min`;
      if (s.passAccuracy) line += `, ${s.passAccuracy}% passes réussies`;
      return line;
    })
    .join("\n");

  let prompt = `Rédige un profil de joueur avec les informations suivantes :

Nom : ${data.name}${data.fullName ? ` (${data.fullName})` : ""}
Âge : ${data.age} ans${data.dateOfBirth ? ` (né le ${data.dateOfBirth})` : ""}
Nationalité : ${data.nationality}
Poste : ${data.position}
Club actuel : ${data.currentClub}`;

  if (data.height) prompt += `\nTaille : ${data.height}`;
  if (data.weight) prompt += `\nPoids : ${data.weight}`;
  if (data.preferredFoot) prompt += `\nPied fort : ${data.preferredFoot}`;
  if (data.marketValue) prompt += `\nValeur marchande : ${data.marketValue}`;
  if (data.contractUntil) prompt += `\nContrat jusqu'en : ${data.contractUntil}`;

  prompt += `\n\nParcours :
${careerLines}`;

  if (data.internationalCaps !== undefined) {
    prompt += `\n\nSélection nationale : ${data.internationalCaps} sélections`;
    if (data.internationalGoals !== undefined) prompt += `, ${data.internationalGoals} buts`;
  }

  prompt += `\n\nStatistiques saison en cours :
${statsLines}`;

  if (data.strengths?.length) {
    prompt += `\n\nPoints forts : ${data.strengths.join(", ")}`;
  }

  if (data.playStyle) {
    prompt += `\nStyle de jeu : ${data.playStyle}`;
  }

  if (data.achievements?.length) {
    prompt += `\n\nPalmarès :`;
    data.achievements.forEach((a) => {
      prompt += `\n  - ${a}`;
    });
  }

  prompt += `\n\nRetourne le résultat en JSON avec les champs : title, content, excerpt, seo_title, seo_description, tags.`;

  return prompt;
}
