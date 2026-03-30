# 360foot.com — Documentation projet

## 1. Vue d'ensemble

**360 Foot** est un média sportif automatisé couvrant le football africain et européen. Les articles (avant-matchs, résultats, actus) sont générés automatiquement via Claude AI à partir des données API-Football, puis publiés sur le site et relayés sur Telegram.

- **URL** : https://360-foot.com
- **Repo** : github.com/coisa95/360foot (branche : `master`)
- **Stack** : Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase + Vercel Pro + Render

---

## 2. Architecture & flux de données

```
API-Football ──→ CRON collect-matches ──→ Supabase (matches)
                                              │
                 CRON enrich-matches ←────────┘ (stats, events, lineups)
                                              │
                 CRON generate-previews ──→ Claude AI ──→ articles (type: preview)
                 CRON generate-articles ──→ Claude AI ──→ articles (type: result)
                 CRON process-rss ──→ RSS feeds ──→ articles (type: news)
                                              │
                              ┌────────────────┘
                              ↓
                    lib/images.ts (injection logos, photos stade, joueurs)
                              ↓
                    Supabase (articles) ──→ Site Next.js (SSR)
                              ↓
                    lib/telegram.ts ──→ @foot360news (Telegram)

Transfermarkt ──→ CRON sync-transfers ──→ Supabase (transfers, players enrichis)
```

---

## 3. Comptes et accès externes

| Service | Usage | Où trouver les credentials |
|---------|-------|---------------------------|
| **Vercel** | Hébergement frontend + API | Dashboard Vercel (compte coffijesugnon) |
| **Render** | CRON jobs backend | Dashboard Render |
| **Supabase** | Base PostgreSQL | Dashboard Supabase (projet vplejedemagidkqbxfqr) |
| **API-Football** | Données matchs, stats, joueurs | api-football.com |
| **Transfermarkt (RapidAPI)** | Transferts, valeurs marchandes | rapidapi.com |
| **Anthropic** | Claude AI (génération articles) | console.anthropic.com |
| **Upstash** | Redis (rate limiting) | console.upstash.com |
| **Telegram** | Bot publication auto | BotFather (@foot360news) |
| **Google** | GTM + GA4 + Search Console | Google Tag Manager / Analytics / Search Console |
| **GitHub** | Code source | github.com/coisa95/360foot |

---

## 4. Structure du projet

```
360foot/
├── app/                          # Pages Next.js (App Router)
│   ├── page.tsx                  # Accueil
│   ├── layout.tsx                # Layout global (JSON-LD, meta, fonts)
│   ├── loading.tsx               # Loading skeleton global
│   ├── not-found.tsx             # Page 404
│   ├── globals.css               # Styles Tailwind
│   ├── actu/                     # Articles (listing + [slug])
│   ├── match/                    # Détail match [slug]
│   ├── resultats/                # Résultats
│   ├── competitions/             # Compétitions
│   ├── ligue/                    # Détail ligue [slug]
│   ├── equipe/                   # Détail équipe [slug]
│   ├── joueur/                   # Détail joueur [slug]
│   ├── transferts/               # Transferts
│   ├── bons-plans/               # Bookmakers affiliés
│   ├── bookmakers/               # Pages bookmakers individuels
│   ├── classement/               # Classements
│   ├── recherche/                # Page recherche
│   ├── mentions-legales/         # Mentions légales
│   ├── methodologie/             # Méthodologie
│   ├── confidentialite/          # Politique confidentialité
│   ├── sitemap.xml/              # Sitemap dynamique
│   ├── news-sitemap.xml/         # News sitemap
│   ├── robots.txt/               # Robots.txt
│   └── api/                      # API Routes
│       ├── cron/                  # 15 routes CRON
│       ├── og/                   # Génération images OG
│       ├── search/               # Recherche full-text
│       ├── track-click/          # Tracking affiliés
│       ├── generate-trending/    # Contenu trending
│       └── setup-rss/            # Config RSS
├── components/                   # Composants React réutilisables
│   ├── header.tsx                # Navigation
│   ├── footer.tsx                # Footer
│   ├── cookie-banner.tsx         # RGPD
│   ├── analytics-loader.tsx      # GA4/GTM conditionnel
│   ├── article-card.tsx          # Carte article
│   ├── match-card.tsx            # Carte match
│   ├── player-card.tsx           # Carte joueur
│   ├── share-buttons.tsx         # Boutons partage
│   ├── standings-table.tsx       # Tableau classement
│   ├── round-nav.tsx             # Navigation journées
│   ├── league-tabs.tsx           # Onglets ligues
│   ├── affiliate-trio.tsx        # Bookmakers trio
│   ├── affiliate-ticker.tsx      # Slider bookmakers
│   └── ui/                       # Composants UI (shadcn)
├── lib/                          # Logique métier
│   ├── claude.ts                 # API Claude AI
│   ├── api-football.ts           # API-Football client
│   ├── transfermarkt.ts          # Transfermarkt client
│   ├── images.ts                 # Injection images articles
│   ├── telegram.ts               # Publication Telegram
│   ├── supabase.ts               # Client Supabase
│   ├── internal-links.ts         # Liens internes
│   ├── rss-fetcher.ts            # Fetch flux RSS
│   ├── prompts/                  # Prompts Claude AI
│   │   ├── preview-article.ts    # Prompt avant-matchs
│   │   └── result-article.ts     # Prompt résultats
│   └── utils.ts                  # Utilitaires
├── middleware.ts                  # Headers sécurité
├── next.config.mjs               # Config Next.js
├── vercel.json                   # Config Vercel (maxDuration)
├── tailwind.config.ts            # Config Tailwind
└── package.json                  # Dependencies
```

### Scripts npm
```bash
npm run dev      # Serveur dev local (port 3000)
npm run build    # Build production
npm run start    # Démarrer en production
npm run lint     # ESLint
```

### vercel.json
- Configure `maxDuration: 300` pour les 12 routes CRON les plus lourdes
- `crons: []` (les CRON sont gérés par Render, pas Vercel)

---

## 5. Pour démarrer (onboarding)


### Prérequis
- Node.js 18+, npm
- Accès au repo GitHub
- Variables d'environnement (voir section 5)

### Commandes
```bash
git clone https://github.com/coisa95/360foot.git
cd 360foot
npm install
```

### Dev local
⚠️ **Le dev local NE FONCTIONNE PAS complètement** — les env vars Supabase (service role key) ne sont configurées que sur Vercel Production. Le site démarre mais les pages dynamiques seront vides.

### Déployer
```bash
git push origin master
# → Vercel auto-deploy via GitHub integration
```
Plus besoin de `vercel --prod --yes` en CLI.

---

## 6. Variables d'environnement (Vercel Production)

| Variable | Service |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service Supabase (⚠️ secrète) |
| `API_FOOTBALL_KEY` | Clé API-Football |
| `ANTHROPIC_API_KEY` | Clé API Claude AI |
| `UPSTASH_REDIS_REST_URL` | URL Redis Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | Token Redis Upstash |
| `TELEGRAM_BOT_TOKEN` | Token bot Telegram |
| `CRON_SECRET` | Auth des routes CRON |
| `NEXT_PUBLIC_GTM_ID` | ID Google Tag Manager |
| `NEXT_PUBLIC_GA_ID` | ID Google Analytics 4 |

---

## 7. Architecture CRON (15 routes)

Toutes sur Render, appelées via HTTP avec `Authorization: Bearer CRON_SECRET`.
Toutes ont `export const maxDuration = 300` (5 min).

**Format d'appel Render → Vercel :**
```
GET https://360-foot.com/api/cron/<route-name>
Headers: Authorization: Bearer <CRON_SECRET>
```
Les CRON sont configurés dans le dashboard Render (Cron Jobs), pas dans vercel.json.

| Route | Fonction | Fréquence suggérée |
|-------|----------|--------------------|
| `collect-matches` | Collecte matchs API-Football | 2x/jour |
| `enrich-matches` | Enrichit matchs (stats, events, lineups) | */30 min |
| `enrich-players` | Enrichit profils joueurs | 1x/jour |
| `enrich-previews` | Enrichit avant-matchs | */30 min |
| `fetch-team-stats` | Stats d'équipes | 1x/jour |
| `fetch-top-players` | Buteurs/passeurs | 1x/jour |
| `generate-articles` | Articles résultat via Claude AI (max 3/batch) | */15 min |
| `generate-previews` | Avant-matchs via Claude AI (max 2/batch) | */15 min |
| `generate-sitemap` | Sitemap XML | 1x/jour |
| `populate-players` | Peuple table joueurs | 1x/semaine |
| `process-rss` | Traite flux RSS → articles news | */30 min |
| `scrape-transfers` | Scrape transferts | 2x/jour |
| `sync-transfers` | Synchro via Transfermarkt (batch 5 clubs/run) | 2x/jour |
| `sync-transfers-apifb` | Synchro via API-Football | 2x/jour |
| `update-standings` | Classements | 1x/jour |

### API routes (non-CRON)

| Route | Fonction |
|-------|----------|
| `api/search` | Recherche full-text (rate limit: 30 req/min/IP) |
| `api/setup-rss` | Configuration flux RSS |
| `api/track-click` | Tracking clics affiliés (rate limit: 20 req/min/IP, allowlist 15 bookmakers) |
| `api/generate-trending` | Génération contenu trending |
| `api/og` | Génération dynamique images Open Graph |

---

## 8. Sécurité

### Headers (middleware.ts)
- `X-Frame-Options: DENY` — anti-clickjacking
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` — HSTS 2 ans
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### Rate limiting (Upstash Redis)
- `track-click` : 20 req/min/IP
- `search` : 30 req/min/IP
- API-Football : délai 7s entre appels CRON

### Validation des entrées (track-click)
- Content-Type obligatoire `application/json`
- Allowlist de 15 bookmakers autorisés (anti-injection)
- Longueur max : bookmaker 100 chars, page_url 2048 chars

### Sanitization
- `sanitize-html` sur le contenu HTML des articles avant rendu
- Internal links : injection sécurisée (pas de lien dans les balises existantes, escape regex)

---

## 9. SEO (score minimum obligatoire : 90/100)

### Implémentation
- **JSON-LD** structuré :
  - Layout : Organization + WebSite (avec SearchAction)
  - Articles : NewsArticle (author, publisher, dates, section)
  - Matchs : SportsEvent (teams, location, competitors)
  - Joueurs, équipes : schemas dédiés
- **Meta tags dynamiques** : title, description (max 155 chars), canonical, OG, Twitter Cards
- **Open Graph** : `og:type`, `og:image` (dynamique via `/api/og`), `og:locale: fr_FR`
- **Twitter Cards** : `summary_large_image` sur toutes les pages
- **robots.txt** : autorise `/`, bloque `/api/` et pagination
- **Sitemaps** : `sitemap.xml` + `news-sitemap.xml` (revalidation 1h)
- **Google Search Console** : balise de vérification
- **Canonical URLs** sur toutes les pages dynamiques

### Checklist avant chaque deploy
- [ ] title unique par page
- [ ] meta description < 155 chars
- [ ] canonical URL
- [ ] og:image (1200x630)
- [ ] Twitter Card
- [ ] JSON-LD valide
- [ ] H1 unique
- [ ] alt text sur toutes les images

---

## 10. Accessibilité

- **Skip-to-content** : lien invisible focusable "Aller au contenu principal"
- **`<main id="main-content">`** pour les lecteurs d'écran
- **ARIA labels** : nav principale, menu mobile, boutons sociaux, footer
- **Alt text** sur toutes les images
- **`lang="fr"`** sur le document HTML
- **Semantic HTML** : `<nav>`, `<main>`, `<footer>`, `<ul>`/`<li>`

---

## 11. Coûts & monitoring

### Coûts mensuels
| Service | Coût |
|---------|------|
| Vercel Pro | $20/mois + build minutes (~$5/mois si auto-deploy) |
| Render | Gratuit |
| Supabase | Gratuit (tier free) |
| API-Football | Selon plan (quota limité) |
| Anthropic (Claude) | Pay-per-use (articles générés) |
| Upstash Redis | Gratuit (tier free) |

### Comment vérifier que tout fonctionne
- **Site** : visiter https://360-foot.com, vérifier la page d'accueil
- **Articles** : vérifier que de nouveaux articles apparaissent dans `/actu`
- **Matchs** : vérifier qu'une page match se charge (ex: `/match/[slug]`)
- **CRON** : Dashboard Render → Logs du service → vérifier les exécutions
- **Telegram** : vérifier les publications sur @foot360news
- **Erreurs** : Vercel Dashboard → Logs → filtrer les erreurs 500

---

## 12. Pièges connus (gotchas)

1. **`players_json` n'existe PAS** dans la table `matches` — ne jamais l'ajouter dans un select Supabase sous peine de 404 silencieux
2. **OG images** doivent être en URL relatives (`/api/og?...`) et non absolues (`https://360-foot.com/api/og?...`) car le domaine n'est pas dans `remotePatterns`
3. **`select("*")`** → toujours utiliser des colonnes spécifiques pour éviter le surcoût Supabase
4. **TypeScript** doit être dans `dependencies` (pas `devDependencies`) sinon Render échoue au build
5. **Rate limit API-Football** : 10 req/min, d'où le délai 7s entre appels dans les CRON
6. **maxDuration** : sans `export const maxDuration = 300`, les routes CRON timeout à 60s sur Vercel
7. **Réponses Claude AI** : peuvent contenir des blocs markdown (\`\`\`json) → toujours stripper avant `JSON.parse`
8. **Dev local incomplet** : les env vars Supabase ne sont que sur Vercel Production

---

## 13. Base de données

### Stats (au 30/03/2026)
matches: 4,651 | players: 2,724 | teams: 641 | articles: 580 | rss_processed: 291 | leagues: 34 | standings: 25

### Tables principales
| Table | Description |
|-------|-------------|
| `matches` | id, slug, date, status, score_home, score_away, stats_json, events_json, lineups_json, predictions_json, h2h_json, injuries_json, home_team_id, away_team_id, league_id, api_football_id |
| `articles` | title, slug, content, excerpt, type (result/preview/news), seo_title, seo_description, og_image_url, tags, match_id, league_id |
| `players` | name, slug, enrichis via API-Football + Transfermarkt (market_value, transfermarkt_id) |
| `teams` | name, slug, logo_url |
| `leagues` | name, slug |
| `standings` | classements par ligue (data_json) |
| `transfers` | player_name, from_team, to_team, fee, date, type |
| `rss_sources` | flux RSS configurés |
| `rss_processed` | articles RSS déjà traités (anti-doublon) |
| `affiliate_clicks` | bookmaker_name, page_url, country, clicked_at |
| `player_id_mapping` | transfermarkt_id ↔ player_slug |

### Domaines images autorisés (next.config.mjs)
media.api-sports.io, upload.wikimedia.org, images.pexels.com, flagcdn.com, crests.football-data.org, cdn.sportmonks.com, img.legaithec.fr, tmssl.akamaized.net, lh3.googleusercontent.com, a.espncdn.com, logo.clearbit.com

---

## 14. Pages du site

| URL | Page |
|-----|------|
| `/` | Accueil (hero + articles récents + matchs) |
| `/actu` | Liste articles (filtres Afrique/Europe/International) |
| `/actu/[slug]` | Article individuel (sanitized HTML + internal links) |
| `/match/[slug]` | Détail match (stats, events, lineups, H2H, prédictions) |
| `/resultats` | Résultats (navigation par journées avec scroll auto) |
| `/competitions` | Compétitions / ligues |
| `/ligue/[slug]` | Détail ligue (classement, matchs, stats) |
| `/equipe/[slug]` | Détail équipe (effectif, résultats, stats) |
| `/joueur/[slug]` | Détail joueur (stats, transferts, valeur marchande) |
| `/transferts` | Transferts récents (Transfermarkt + API-Football) |
| `/bons-plans` | Bookmakers affiliés (1xBet, Melbet, 1win + 12 autres) |
| `/methodologie` | Page méthodologie |
| `/mentions-legales` | Mentions légales |

---

## 15. Composants et modules clés

| Fichier | Rôle |
|---------|------|
| `lib/claude.ts` | Appel API Claude AI pour générer les articles |
| `lib/prompts/preview-article.ts` | Prompt système pour les avant-matchs |
| `lib/prompts/result-article.ts` | Prompt système pour les articles résultat |
| `lib/images.ts` | `getArticleImages()`, `injectImagesIntoHTML()`, `buildArticleOgUrl()` |
| `lib/api-football.ts` | Client API-Football (matchs, stats, venues) |
| `lib/transfermarkt.ts` | Client Transfermarkt (joueurs, transferts, valeurs marchandes) |
| `lib/telegram.ts` | Publication automatique sur Telegram (@foot360news) |
| `lib/supabase.ts` | Client Supabase (`createClient()`) |
| `lib/internal-links.ts` | Injection de liens internes dans le contenu HTML |
| `components/header.tsx` | Navigation principale + menu mobile |
| `components/footer.tsx` | Footer (liens sociaux : Facebook, Telegram) |
| `components/cookie-banner.tsx` | Bannière RGPD consentement cookies |
| `components/analytics-loader.tsx` | Chargement conditionnel GA4/GTM après consentement |
| `app/api/og/route.tsx` | Génération dynamique d'images Open Graph |
| `middleware.ts` | Headers sécurité (HSTS, X-Frame-Options, etc.) |
| `next.config.mjs` | Config Next.js (remotePatterns, images AVIF/WebP, cache 7j) |

---

## 16. Historique des modifications (45 au total)

### Audit & corrections (30/03/2026)
32. **Audit complet site** — SEO (87→93), Sécurité (55→75), Performance (65→80), Accessibilité (70→85)
33. **SEO : og:locale fr_FR** — Ajouté sur 21 pages dynamiques et statiques
34. **SEO : JSON-LD ligue** — Ajout schema SportsOrganization sur `ligue/[slug]`
35. **SEO : Sitemap corrigé** — Suppression URLs `/classement/` dupliquées (404)
36. **SEO : og:image absolues** — URLs relatives → `https://360-foot.com/api/og?...` sur toutes les pages
37. **SEO : Twitter card images** — Ajoutées sur toutes les pages dynamiques manquantes
38. **Sécurité : CSP header** — Content-Security-Policy ajouté dans middleware.ts
39. **Sécurité : Erreurs masquées** — `details: String(error)` supprimé de 14 routes CRON
40. **Sécurité : Sanitization renforcée** — `iframe` et `style` retirés de sanitize-html
41. **Sécurité : Échappement JSON-LD** — Fonction `escapeJsonLd()` anti-XSS dans articles
42. **Performance : N+1 queries fix** — `match/[slug]` : 1 requête batch au lieu de 50 individuelles
43. **Performance : Fetch limité** — `actu/[slug]` : `.limit(500/1000)` sur teams/players/leagues
44. **Performance : Images optimisées** — `unoptimized` retiré de 10 fichiers (18 occurrences)
45. **Performance : Dynamic imports** — `ArticleCard`, `StandingsTable`, `AffiliateTrio` lazy-loaded
46. **Error boundaries** — 20 fichiers `error.tsx` créés (total 27 pages couvertes)
47. **Sécurité : Rate limiting /api/search** — 30 req/min/IP avec Upstash Redis, headers X-RateLimit-*, fallback gracieux
48. **Sécurité : timingSafeEqual CRON** — Helper `lib/auth.ts` + 15 routes CRON migrées vers crypto.timingSafeEqual()
49. **Sécurité : Vérification git history** — Confirmé : aucun fichier .env dans l'historique git
50. **Fix critique : Articles 404** — Colonnes `updated_at` et `image` n'existent pas dans table `articles` → supprimées des select Supabase (causait 404 sur TOUS les articles)
51. **Fix : @vercel/analytics et @vercel/speed-insights** — Packages manquants ajoutés aux dependencies

### Corrections précédentes
1. **maxDuration CRON** — Ajout `maxDuration = 300` sur 7 routes qui timeoutaient à 60s
2. **Pages matchs 404** — Suppression colonne inexistante `players_json` du select Supabase
3. **Images OG cassées** — URLs absolues → relatives dans `lib/images.ts` + mise à jour 21 articles en DB
4. **Erreur TypeScript ReactNode** — Cast `unknown` → `string` avec ternaire dans `app/actu/page.tsx`
5. **Erreur TypeScript type casts** — Casts explicites `as string` sur les propriétés `Record<string, unknown>`
6. **Scripts GA/GTM inline** — Supprimés, remplacés par `AnalyticsLoader`

### Features ajoutées
7. **Bannière RGPD** — Consentement cookies + analytics conditionnelles + optimisation 21x `select("*")`
8. **Lien Facebook** footer
9. **Publication Telegram** — Auto-publish articles sur @foot360news (photo + caption + hashtags)
10. **Lien Telegram** footer
11. **Audit complet** — Sécurité (headers, rate limiting, sanitization) + SEO (JSON-LD, OG, canonical, sitemaps) + accessibilité (ARIA, skip-link, semantic HTML)
12. **Google Search Console** — Balise vérification
13. **Image dupliquée** — Suppression du doublon image featured dans les articles
14. **Images RSS** — Extraction images depuis flux RSS pour thumbnails
15. **Refonte bookmakers** — Redesign avec logos et meilleur messaging
16. **Boutons partage** + pages buteurs/passeurs + photos effectifs + "où regarder"
17. **GA4 + GTM** — Google Analytics 4 + Tag Manager
18. **Vercel Analytics** + Speed Insights
19. **Images API-Football** — Remplacement Pexels par logos/photos réels (équipes, stades, joueurs)
20. **Navigation rounds** — Auto-centrage journée active + scroll auto
21. **PWA icônes** fond sombre
22. **Redesign homepage** — Dark blue theme, hero "Football Afrique & Europe", glow effects
23. **TypeScript dependencies** — Déplacé vers dependencies pour build Render
24. **Scraping transferts** — Transfermarkt API, 19 clubs monitorés, batch 5/run
25. **Pages actu + filtres** — Listing articles Afrique/Europe/International
26. **Classements** — Lecture data_json, logos, forme récente
27. **CRON optimisations** — Free→Pro, rate limit 7s, batch limits, filtre matchs jeunes
28. **Ligues ajoutées** — MLS, Saudi Pro League, Conference League, CdM Afrique
29. **Liens affiliés** — 1xBet, Melbet, 1win (vrais liens) + carousel slider
30. **Parsing Claude AI** — Strip markdown blocks avant JSON.parse
31. **Setup initial** — Création projet Next.js 14 + Supabase + API-Football + Claude AI

---

## 17. Tâches en attente

1. **Nettoyage images dupliquées en DB** — Anciens articles avec images en double dans le contenu HTML
2. ~~**Error boundaries**~~ — ✅ Fait (20 fichiers créés, 27 pages couvertes)
3. **Optimisation fréquence CRON** — Réduire `enrich-matches` */10 → */30, `collect-matches` → 2x/jour
4. **PWA complète** — Service worker et manifest pour mode hors-ligne
5. **Dev local** — Configurer `.env.local` avec les vars Supabase pour permettre le dev local
6. **Rotation CRON_SECRET** — ⚠️ Action manuelle : `openssl rand -base64 32` puis MAJ Vercel + Render + .env.production
7. ~~**Rate limiting /api/search**~~ — ✅ Fait (30 req/min/IP, Upstash Redis)
8. ~~**timingSafeEqual pour CRON auth**~~ — ✅ Fait (lib/auth.ts + 15 routes)

---

## 18. Instructions permanentes

1. **SEO minimum 90/100** — Le score SEO ne doit JAMAIS descendre en dessous de 90. Checklist obligatoire avant chaque deploy (section 8).
2. **Actions techniques autonomes** — Lancer les corrections techniques (bugs, optimisations, sécurité) sans attendre validation. Seules les décisions produit/business nécessitent un avis.
