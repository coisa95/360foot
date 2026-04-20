# Guide d'intégration — API Syndication 360foot → Afroprono

## Clé API

> ⚠️ La clé n'est PAS committée dans ce repo. Demande-la à l'admin 360foot
> via un canal privé (Signal, Telegram, ou autre). Elle change régulièrement.

```
SYNDICATION_API_KEY=<demande à l'admin>
```

Toutes les requêtes doivent inclure le header :

```
x-api-key: REDACTED_ASK_ADMIN
```

---

## Endpoints disponibles

Base URL : `https://360-foot.com`

### 1. Articles

```
GET /api/syndication/articles
```

| Param | Type | Défaut | Description |
|-------|------|--------|-------------|
| `type` | string | tous | Types séparés par virgule : `pronostic`, `streaming`, `result`, `transfer`, `recap`, `preview`, `player_profile` |
| `league` | string | toutes | Slug de ligue (ex: `ligue-1-cote-divoire`) |
| `limit` | number | 20 | Max 50 |
| `offset` | number | 0 | Pour pagination |
| `since` | string | — | Date ISO (ex: `2026-04-01T00:00:00`) |

**Exemple — derniers pronostics et streaming :**

```bash
curl -H "x-api-key: REDACTED_ASK_ADMIN" \
  "https://360-foot.com/api/syndication/articles?type=pronostic,streaming&limit=10"
```

**Réponse :**

```json
{
  "articles": [
    {
      "slug": "psg-bayern-pronostic-ldc-2026",
      "title": "PSG – Bayern : notre pronostic pour la demi-finale LDC",
      "excerpt": "Analyse complète et pronostic...",
      "content": "<p>Le contenu HTML complet de l'article...</p>",
      "type": "pronostic",
      "tags": ["PSG", "Bayern", "Champions League"],
      "published_at": "2026-04-16T14:30:00.000Z",
      "og_image_url": "https://360-foot.com/api/og?title=...",
      "seo_title": "PSG – Bayern : Pronostic LDC 2026",
      "seo_description": "Notre analyse et pronostic...",
      "league_name": "Champions League",
      "league_slug": "champions-league",
      "canonical_url": "https://360-foot.com/actu/psg-bayern-pronostic-ldc-2026"
    }
  ],
  "total": 45,
  "limit": 10,
  "offset": 0
}
```

### 2. Matchs

```
GET /api/syndication/matches
```

| Param | Type | Défaut | Description |
|-------|------|--------|-------------|
| `date` | string | aujourd'hui | Format `YYYY-MM-DD` |
| `league` | string | toutes | Slug de ligue |
| `status` | string | tous | `NS` (à venir), `1H`, `HT`, `2H`, `FT` (terminé), `PST` (reporté) |
| `limit` | number | 30 | Max 100 |

**Exemple — matchs du jour :**

```bash
curl -H "x-api-key: REDACTED_ASK_ADMIN" \
  "https://360-foot.com/api/syndication/matches?date=2026-04-16"
```

**Réponse :**

```json
{
  "matches": [
    {
      "slug": "psg-bayern-2026-04-16",
      "date": "2026-04-16T20:00:00.000Z",
      "status": "NS",
      "score_home": null,
      "score_away": null,
      "home_team": {
        "name": "Paris Saint-Germain",
        "slug": "paris-saint-germain",
        "logo_url": "https://media.api-sports.io/football/teams/85.png"
      },
      "away_team": {
        "name": "Bayern Munich",
        "slug": "bayern-munich",
        "logo_url": "https://media.api-sports.io/football/teams/157.png"
      },
      "league_name": "Champions League",
      "league_slug": "champions-league",
      "canonical_url": "https://360-foot.com/match/psg-bayern-2026-04-16"
    }
  ],
  "total": 24,
  "date": "2026-04-16"
}
```

### 3. Classements

```
GET /api/syndication/standings
```

| Param | Type | Défaut | Description |
|-------|------|--------|-------------|
| `league` | string | **obligatoire** | Slug de ligue ou `all` pour tout récupérer |

**Exemple :**

```bash
curl -H "x-api-key: REDACTED_ASK_ADMIN" \
  "https://360-foot.com/api/syndication/standings?league=ligue-1-cote-divoire"
```

**Réponse :**

```json
{
  "standings": [
    {
      "league_name": "Ligue 1 Côte d'Ivoire",
      "league_slug": "ligue-1-cote-divoire",
      "season": "2026",
      "updated_at": "2026-04-16T12:00:00.000Z",
      "rows": [
        {
          "rank": 1,
          "team_name": "ASEC Mimosas",
          "team_slug": "asec-mimosas",
          "team_logo": "https://media.api-sports.io/football/teams/...",
          "played": 24,
          "won": 18,
          "drawn": 4,
          "lost": 2,
          "goals_for": 45,
          "goals_against": 12,
          "goal_diff": 33,
          "points": 58
        }
      ]
    }
  ]
}
```

---

## Slugs de ligues disponibles

| Slug | Pays |
|------|------|
| `ligue-1-cote-divoire` | Côte d'Ivoire |
| `ligue-pro-senegal` | Sénégal |
| `elite-one-cameroun` | Cameroun |
| `ligue-1-mali` | Mali |
| `fasofoot` | Burkina Faso |
| `ligue-1-benin` | Bénin |
| `linafoot` | RD Congo |
| `botola-pro` | Maroc |
| `ligue-1-tunisie` | Tunisie |
| `ligue-1-france` | France |
| `premier-league` | Angleterre |
| `la-liga` | Espagne |
| `serie-a` | Italie |
| `bundesliga` | Allemagne |
| `champions-league` | Europe |

---

## SEO — OBLIGATOIRE

Pour éviter la pénalité Google duplicate content, **chaque page article** sur afroprono doit avoir dans le `<head>` :

```html
<link rel="canonical" href="https://360-foot.com/actu/{slug}" />
```

Le champ `canonical_url` est fourni dans chaque réponse API pour ça.

**Exemple Next.js :**

```tsx
// app/pronostic/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const article = await fetchArticle(params.slug);
  return {
    title: article.seo_title || article.title,
    description: article.seo_description || article.excerpt,
    alternates: {
      canonical: article.canonical_url, // ← pointe vers 360foot
    },
  };
}
```

---

## Exemple d'intégration Next.js complet

### 1. `.env.local` d'afroprono

```env
SYNDICATION_API_KEY=REDACTED_ASK_ADMIN
SYNDICATION_BASE_URL=https://360-foot.com
```

### 2. Fonction utilitaire — `lib/syndication.ts`

```ts
const BASE = process.env.SYNDICATION_BASE_URL || "https://360-foot.com";
const KEY = process.env.SYNDICATION_API_KEY!;

export async function fetchSyndicatedArticles(params: {
  type?: string;
  league?: string;
  limit?: number;
  offset?: number;
  since?: string;
}) {
  const qs = new URLSearchParams();
  if (params.type) qs.set("type", params.type);
  if (params.league) qs.set("league", params.league);
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.offset) qs.set("offset", String(params.offset));
  if (params.since) qs.set("since", params.since);

  const res = await fetch(`${BASE}/api/syndication/articles?${qs}`, {
    headers: { "x-api-key": KEY },
    next: { revalidate: 120 },
  });

  if (!res.ok) throw new Error(`Syndication API error: ${res.status}`);
  return res.json();
}

export async function fetchSyndicatedMatches(params: {
  date?: string;
  league?: string;
  status?: string;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params.date) qs.set("date", params.date);
  if (params.league) qs.set("league", params.league);
  if (params.status) qs.set("status", params.status);
  if (params.limit) qs.set("limit", String(params.limit));

  const res = await fetch(`${BASE}/api/syndication/matches?${qs}`, {
    headers: { "x-api-key": KEY },
    next: { revalidate: 60 },
  });

  if (!res.ok) throw new Error(`Syndication API error: ${res.status}`);
  return res.json();
}

export async function fetchSyndicatedStandings(league: string) {
  const res = await fetch(`${BASE}/api/syndication/standings?league=${league}`, {
    headers: { "x-api-key": KEY },
    next: { revalidate: 300 },
  });

  if (!res.ok) throw new Error(`Syndication API error: ${res.status}`);
  return res.json();
}
```

### 3. Page pronostics — `app/pronostics/page.tsx`

```tsx
import { fetchSyndicatedArticles } from "@/lib/syndication";

export const revalidate = 120;

export default async function PronosticsPage() {
  const { articles } = await fetchSyndicatedArticles({
    type: "pronostic",
    limit: 20,
  });

  return (
    <div>
      <h1>Pronostics du jour</h1>
      {articles.map((article) => (
        <a key={article.slug} href={`/pronostic/${article.slug}`}>
          <h2>{article.title}</h2>
          <p>{article.excerpt}</p>
        </a>
      ))}
    </div>
  );
}
```

### 4. Page article individuelle — `app/pronostic/[slug]/page.tsx`

```tsx
import { fetchSyndicatedArticles } from "@/lib/syndication";
import { notFound } from "next/navigation";
import { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { articles } = await fetchSyndicatedArticles({ limit: 1 });
  // Ou fetch direct par slug si tu ajoutes un param slug à l'API
  const article = articles.find((a) => a.slug === slug);
  if (!article) return { title: "Article introuvable" };

  return {
    title: article.seo_title || article.title,
    description: article.seo_description || article.excerpt,
    alternates: {
      canonical: article.canonical_url, // ← OBLIGATOIRE pour SEO
    },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: article.og_image_url ? [article.og_image_url] : [],
    },
  };
}

export default async function PronosticPage({ params }: Props) {
  const { slug } = await params;
  // Fetch tous les pronostics et trouver par slug
  // (ou ajouter un param ?slug= à l'API pour un fetch direct)
  const { articles } = await fetchSyndicatedArticles({
    type: "pronostic,streaming",
    limit: 50,
  });
  const article = articles.find((a) => a.slug === slug);

  if (!article) notFound();

  return (
    <article>
      <h1>{article.title}</h1>
      <time dateTime={article.published_at}>
        {new Date(article.published_at).toLocaleDateString("fr-FR")}
      </time>
      <div dangerouslySetInnerHTML={{ __html: article.content }} />
    </article>
  );
}
```

---

## Rate limits

- Pas de rate limit hard côté 360foot pour l'instant
- Recommandé : `revalidate: 60-120` côté afroprono (pas de fetch à chaque requête utilisateur)
- L'API retourne des données fraîches (pas de cache serveur)

---

## Déploiement sur le même VPS

Si afroprono tourne sur le même VPS Docker, il peut appeler l'API via le réseau interne :

```env
SYNDICATION_BASE_URL=http://nextjs:3000
```

Pour ça, ajouter le service afroprono au même réseau Docker `foot360` dans un `docker-compose.override.yml` ou dans son propre compose avec `external: true` :

```yaml
services:
  afroprono:
    # ... config afroprono
    networks:
      - foot360

networks:
  foot360:
    external: true
```

Cela évite de passer par Caddy/internet et réduit la latence à ~1ms.

---

## Contact

En cas de problème avec l'API, contacter l'admin 360foot.
# Syndication API added — see docs/SYNDICATION-AFROPRONO.md
