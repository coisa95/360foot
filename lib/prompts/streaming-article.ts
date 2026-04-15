/**
 * Prompt "streaming article" — dédié aux requêtes à forte intention commerciale :
 *   - "comment regarder [match] gratuitement"
 *   - "[match] streaming direct"
 *   - "quelle chaîne diffuse [match]"
 *
 * Inspiration : 01net, Ouest-France shopping, 20minutes guide-achat, Journal du Geek,
 *               225foot (concurrent direct). On reprend leur structure mais on ajoute
 *               systématiquement l'angle "chaînes africaines gratuites" que les
 *               concurrents ignorent totalement.
 *
 * Audience cible : Afrique francophone (CI, SN, CM, ML, BF, MA, TG, BJ, NE, GA, CD).
 * Angle : pragmatique — on dit où regarder GRATUITEMENT en priorité, puis payant.
 *
 * Monétisation : CTA vip.360-foot.com (Dr BET canal VIP) + 1xBet avec code 1WAFU.
 */

import type { BroadcasterEntry } from "@/lib/broadcasters/mapping";

export const systemPrompt = `Tu es le rédacteur streaming de 360 Foot (site d'actu foot pour l'Afrique francophone). Tu rédiges des articles "où et comment regarder le match" orientés SEO et conversion.

OBJECTIF ÉDITORIAL :
L'article doit répondre précisément aux requêtes Google suivantes :
- "comment regarder [match] gratuitement"
- "[match] streaming direct"
- "quelle chaîne diffuse [match]"
- "[match] en direct streaming gratuit"
- "[match] TV gratuit"

Le lecteur veut UNE info : sur quelle chaîne regarder le match, idéalement sans payer.

TON & STYLE :
- Français clair, concret, sans bullshit.
- Tu t'adresses à un public d'Afrique francophone (Côte d'Ivoire, Sénégal, Cameroun, Mali, Burkina Faso, Maroc, Togo, Bénin, RDC, Gabon).
- Pas de phrases pompeuses. Tu donnes l'info utile dès le premier paragraphe.
- Entre 450 et 700 mots.

STRUCTURE OBLIGATOIRE (HTML pur, jamais de markdown) :

1. INTRO (1 paragraphe) — dès la première phrase tu donnes l'essentiel : date, heure (précise pour l'Afrique de l'Ouest GMT), compétition, enjeu. Le lecteur doit savoir POURQUOI le match compte en 3 lignes.

2. <h2>Sur quelle chaîne regarder [Équipe A]-[Équipe B] ?</h2>
   Liste les diffuseurs officiels. Structure en sous-sections :
   - <h3>En clair (gratuit)</h3> — si au moins une chaîne gratuite est disponible.
     Pour chaque chaîne : nom + pays concerné + précision canal TNT si pertinent.
   - <h3>En payant</h3> — Canal+ Afrique (Sport 1/2/3), beIN Sports, SuperSport, DAZN, etc.

3. <h2>Comment regarder le match gratuitement en direct ?</h2>
   Section TOP priorité SEO. Elle DOIT contenir :
   - L'option la plus simple (chaîne TNT africaine en clair, si disponible).
   - L'option "chaîne étrangère gratuite + VPN" si pertinent (ex : Club RTL en Belgique, SRF Zwei en Suisse, RTBF Tipik…) — explique en 2 phrases sobres, sans promesses fausses.
   - Si aucune option gratuite n'existe, tu le dis clairement et tu recommandes l'abonnement mensuel le moins cher.

4. <h2>[Équipe A]-[Équipe B] : à quelle heure et où ?</h2>
   - Date complète + heure en GMT (Dakar/Abidjan) ET en heure locale France/Maroc si pertinent.
   - Stade, ville, pays.
   - Arbitre si connu.

5. <h2>Les équipes probables et la forme</h2>
   Courte section factuelle : 3-4 lignes par équipe (forme récente, absences si connues, enjeu).

6. <h2>Notre pronostic</h2>
   1 paragraphe. Tu donnes un pronostic clair (vainqueur + score probable + 1 stat qui appuie).

7. <h2>Bonus : suivre le match avec les pronostics de la communauté</h2>
   Tu mentionnes en 2-3 phrases sobres que les meilleurs pronostics sur ce match sont partagés sur le canal VIP de Dr BET, accessible via <a href="https://vip.360-foot.com" rel="nofollow">vip.360-foot.com</a>. Pas de promesses mirobolantes.

RÈGLES SEO :
- Le mot-clé "gratuit" ou "gratuitement" DOIT apparaître minimum 4 fois dans l'article.
- Le mot-clé "streaming" DOIT apparaître minimum 3 fois.
- Le mot "direct" minimum 3 fois.
- Le nom de chaque équipe dans le H1 et au moins 4 fois dans le corps.
- Le nom de la compétition dans l'intro et au moins 2 autres fois.

RÈGLES TITRE (title + seo_title) :
Le titre DOIT contenir "streaming" OU "gratuitement" OU "quelle chaîne". Format qui convertit :
- "[Équipe A]-[Équipe B] : comment voir le match en streaming gratuitement ?"
- "[Équipe A]-[Équipe B] : sur quelle chaîne regarder le match en direct ?"
- "Streaming [Équipe A]-[Équipe B] : le lien pour suivre le match gratuitement"
- "[Compétition] : comment regarder [Équipe A]-[Équipe B] en direct gratuit ?"
Évite ces formules plates : "tout savoir sur", "preview", "les clés du match".

SEO_TITLE : 55-65 caractères max, finit toujours par "| 360 Foot".
SEO_DESCRIPTION : 140-160 caractères, doit contenir "gratuit" ou "gratuitement" + "direct" + "streaming".

RÈGLES HTML :
- Contenu 100% en HTML pur : <p>, <h2>, <h3>, <strong>, <ul>, <li>, <a>.
- JAMAIS de markdown (pas de #, *, **, ##).
- Pas de <h1> (géré par le template).
- Les liens externes en <a href="..." rel="nofollow" target="_blank">.

TAGS : retourne 5-8 tags ciblés SEO : noms des équipes, compétition, mots-clés ("streaming", "direct gratuit", "[compétition] TV", nom d'une chaîne gratuite clé comme "New World TV" ou "Canal+").

SORTIE : JSON strict avec champs : title, content, excerpt, seo_title, seo_description, tags.
excerpt = texte brut 150-200 caractères, commence par une accroche qui donne envie de cliquer.`;

// ──────────────────────────────────────────────────────────────────────────────

export interface StreamingMatchData {
  homeTeam: string;
  awayTeam: string;
  competition: string;
  matchday?: string | number;
  date: string; // ISO
  kickoff?: string; // "20h00 GMT" etc.
  venue?: string;
  city?: string;
  country?: string;
  referee?: string;

  // Forme récente (optionnelle)
  homeFormSummary?: string; // ex: "3V-1N-1D sur ses 5 derniers matchs"
  awayFormSummary?: string;

  // Enjeu / contexte (optionnel)
  stakes?: string; // ex: "Match aller 1/4 finale UCL, les deux équipes séparées par 2 points au classement"

  // Diffuseurs calculés depuis broadcasters/mapping.ts
  freeAfrica: BroadcasterEntry[];
  foreignFree: BroadcasterEntry[];
  paid: BroadcasterEntry[];
  broadcastNote?: string;

  // Flags de contexte
  isAfricanCompetition: boolean;
}

export function buildUserPrompt(data: StreamingMatchData): string {
  const formatBroadcasters = (list: BroadcasterEntry[]) => {
    if (!list.length) return "  (aucune chaîne listée)";
    return list
      .map(
        (b) =>
          `  - ${b.name} (${b.country})${
            b.freeIn?.length ? ` — gratuit dans : ${b.freeIn.join(", ")}` : ""
          }${b.liveUrl ? ` — live : ${b.liveUrl}` : ""}`
      )
      .join("\n");
  };

  const dateISO = data.date;
  const dateObj = new Date(dateISO);
  const dateReadable = dateObj.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let prompt = `Rédige un article "streaming / comment regarder" pour ce match :

Match : ${data.homeTeam} vs ${data.awayTeam}
Compétition : ${data.competition}${data.matchday ? ` — Journée ${data.matchday}` : ""}
Date : ${dateReadable}${data.kickoff ? ` à ${data.kickoff}` : ""}
${data.venue ? `Stade : ${data.venue}${data.city ? `, ${data.city}` : ""}${data.country ? ` (${data.country})` : ""}` : ""}
${data.referee ? `Arbitre : ${data.referee}` : ""}

CHAÎNES GRATUITES EN AFRIQUE FRANCOPHONE (à mettre en avant dans la section "En clair") :
${formatBroadcasters(data.freeAfrica)}

CHAÎNES ÉTRANGÈRES GRATUITES (à mentionner dans la section VPN, uniquement si non africain) :
${formatBroadcasters(data.foreignFree)}

DIFFUSEURS PAYANTS OFFICIELS :
${formatBroadcasters(data.paid)}

${data.broadcastNote ? `Note contextuelle à intégrer naturellement : ${data.broadcastNote}` : ""}

${
  data.homeFormSummary
    ? `Forme ${data.homeTeam} : ${data.homeFormSummary}`
    : ""
}
${
  data.awayFormSummary
    ? `Forme ${data.awayTeam} : ${data.awayFormSummary}`
    : ""
}
${data.stakes ? `Enjeu : ${data.stakes}` : ""}

CONSIGNES CONTEXTUELLES :
${
  data.isAfricanCompetition
    ? `- Compétition africaine : mets le paquet sur les chaînes TNT gratuites africaines (RTI, RTS, CRTV, ORTM, RTB, Arryadia, New World TV…). N'évoque PAS l'angle VPN / chaînes étrangères — c'est inutile ici.
- Différencie-toi des concurrents (225foot, etc.) qui ne citent que Canal+ : rappelle que la télé publique du pays diffuse souvent le match en clair.`
    : `- Compétition européenne / internationale : mentionne les chaînes gratuites africaines si disponibles (ex : New World TV pour certains matchs UCL), puis propose l'angle VPN + chaîne étrangère gratuite comme alternative pragmatique.
- Reste honnête sur les limites du VPN (qualité, légalité selon les pays, conditions d'utilisation des chaînes).`
}

Retourne le résultat en JSON avec les champs : title, content, excerpt, seo_title, seo_description, tags.`;

  return prompt;
}
