export const systemPrompt = `Tu es le rédacteur sportif de 360 Foot, un média d'actualité football africain francophone. Tu rédiges des articles de transferts factuels et analytiques.

Règles :
- Rédige en français uniquement.
- L'article doit faire entre 200 et 400 mots.
- Reste factuel sur les détails du transfert (montant, durée du contrat, clubs concernés).
- Inclus un profil du joueur (âge, poste, nationalité, parcours).
- Analyse l'impact du transfert pour le club acheteur et le club vendeur.
- Adopte un ton professionnel et informatif.

TITRES — RÈGLES CRITIQUES :
Le titre doit accrocher et contenir une info clé (montant, destination, contexte).
Styles à alterner :
1. Montant choc : "30M€ : le prix fou payé par le PSG pour le joyau ivoirien"
2. Direction + joueur : "Osimhen file à Chelsea : les détails du deal"
3. Impact sportif : "Avec Mané, Al-Hilal a désormais l'attaque la plus chère du monde"
4. Surprise/rupture : "Coup de théâtre : le transfert de Salah tombe à l'eau"
5. Prêt/retour : "Retour aux sources : Aubameyang prêté à l'OM pour 6 mois"

PHRASES INTERDITES : "officiel :", "c'est fait !", "ça se confirme", "le point sur le transfert de"

- IMPORTANT : Le champ "content" doit être en HTML pur (balises <p>, <h2>, <h3>, <strong>, <ul>, <li>). N'utilise JAMAIS de markdown (#, *, **, ##). Pas de balises <h1>.
- Le champ "excerpt" doit être du texte brut sans aucun formatage.
- Retourne le résultat au format JSON avec les champs suivants : title, content, excerpt, seo_title, seo_description, tags.`;

export interface TransferData {
  playerName: string;
  age: number;
  nationality: string;
  position: string;
  fromClub: string;
  toClub: string;
  fee?: string;
  contractDuration?: string;
  previousClubs?: string[];
  seasonStats?: {
    goals?: number;
    assists?: number;
    appearances?: number;
    competition?: string;
  };
  officialDate?: string;
  loanDeal?: boolean;
  buyOption?: string;
  quotes?: Array<{
    speaker: string;
    role: string;
    text: string;
  }>;
}

export function buildUserPrompt(data: TransferData): string {
  let prompt = `Rédige un article de transfert avec les informations suivantes :

Joueur : ${data.playerName}
Âge : ${data.age} ans
Nationalité : ${data.nationality}
Poste : ${data.position}
Club vendeur : ${data.fromClub}
Club acheteur : ${data.toClub}
${data.loanDeal ? "Type : Prêt" : "Type : Transfert définitif"}`;

  if (data.fee) prompt += `\nMontant : ${data.fee}`;
  if (data.contractDuration) prompt += `\nDurée du contrat : ${data.contractDuration}`;
  if (data.buyOption) prompt += `\nOption d'achat : ${data.buyOption}`;
  if (data.officialDate) prompt += `\nDate officielle : ${data.officialDate}`;

  if (data.previousClubs?.length) {
    prompt += `\n\nParcours : ${data.previousClubs.join(" → ")} → ${data.toClub}`;
  }

  if (data.seasonStats) {
    const s = data.seasonStats;
    prompt += `\n\nStatistiques cette saison${s.competition ? ` (${s.competition})` : ""} :`;
    if (s.appearances !== undefined) prompt += `\n  - Matchs joués : ${s.appearances}`;
    if (s.goals !== undefined) prompt += `\n  - Buts : ${s.goals}`;
    if (s.assists !== undefined) prompt += `\n  - Passes décisives : ${s.assists}`;
  }

  if (data.quotes?.length) {
    prompt += `\n\nDéclarations :`;
    data.quotes.forEach((q) => {
      prompt += `\n  - ${q.speaker} (${q.role}) : "${q.text}"`;
    });
  }

  prompt += `\n\nRetourne le résultat en JSON avec les champs : title, content, excerpt, seo_title, seo_description, tags.`;

  return prompt;
}
