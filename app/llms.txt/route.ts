import { NextResponse } from "next/server";

// AEO (Answer Engine Optimization) — fichier llms.txt servi à la racine du
// site pour aider les moteurs d'IA (ChatGPT search, Perplexity, etc.) à
// comprendre la structure du site et trouver les bonnes URLs canoniques.
// Cf. https://llmstxt.org
export const dynamic = "force-static";
export const revalidate = 86400;

export async function GET() {
  const body = `# 360 Foot — Football africain et européen

> Média 360 Foot couvrant l'actualité football : pronostics, résultats, transferts, ligues africaines et européennes en français.

## Sections principales
- [Streaming foot — toutes les chaînes et alternatives](https://360-foot.com/streaming)
- [Actualités](https://360-foot.com/actu)
- [Pronostics du jour](https://360-foot.com/pronostic)
- [Matchs en direct](https://360-foot.com/matchs)
- [Compétitions](https://360-foot.com/competitions)
- [Transferts](https://360-foot.com/transferts)
- [Bons plans](https://360-foot.com/bons-plans)

## Pages géo Afrique
- [Côte d'Ivoire](https://360-foot.com/selection/ci)
- [Sénégal](https://360-foot.com/selection/sn)
- [Cameroun](https://360-foot.com/selection/cm)
- [Mali](https://360-foot.com/selection/ml)
- [Bénin](https://360-foot.com/selection/bj)
- [Burkina Faso](https://360-foot.com/selection/bf)

## Sitemaps
- [Articles](https://360-foot.com/sitemap-articles.xml)
- [Pronostics](https://360-foot.com/sitemap-pronostics.xml)
- [Matchs](https://360-foot.com/sitemap-matches.xml)
- [Équipes](https://360-foot.com/sitemap-teams.xml)
- [Joueurs](https://360-foot.com/sitemap-players.xml)
- [Ligues](https://360-foot.com/sitemap-leagues.xml)

## Méthodologie éditoriale
- [Méthodologie](https://360-foot.com/methodologie)
- [À propos](https://360-foot.com/a-propos)

## Contact
- [Mentions légales](https://360-foot.com/mentions-legales)
`;
  return new NextResponse(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
