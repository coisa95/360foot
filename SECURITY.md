# Security & Operations — 360foot

État sécurité & SEO de l'app après les audits d'avril 2026. Ce document
liste les mesures en place et les dettes restantes. À mettre à jour
quand une dette est payée ou qu'un nouveau levier est activé.

## ✅ Mesures en place

### Authentification & secrets
- `SYNDICATION_API_KEY` : vérifié via `crypto.timingSafeEqual` (pas de timing
  attack). Voir `lib/syndication-auth.ts`.
- `INDEXNOW_SECRET` / `INDEXNOW_KEY` : plus de fallback hardcodé ; endpoint
  répond 500 si env vars manquantes.
- `INTERNAL_OPS_KEY` : protège `/api/health?full=1` (token usage cumulés,
  estimated spend USD). Sans cette clé, `/api/health` ne renvoie que
  `{ status, timestamp }`. Déclarée dans `.env.example` et
  `docker-compose.yml` ; à set manuellement dans Coolify env vars.
- Clés API gérées via Coolify env vars (encryptées). Ne JAMAIS committer en
  clair. Le doc `docs/SYNDICATION-AFROPRONO.md` renvoie vers l'admin pour la
  clé, jamais inline.
- `CRON_SECRET` contrôle l'accès aux routes `/api/cron/*` via `lib/auth.ts`.

### RLS (Row-Level Security)
- Les pages publiques (server components dans `app/`) utilisent
  `createAnonClient()` depuis `@/lib/supabase` — pas `createClient()`
  (qui utilise la SERVICE_ROLE_KEY et bypasse RLS).
- Les routes `/api/cron/*` qui écrivent en DB gardent `createClient()`
  (service role).
- **RLS policies Supabase doivent être `SELECT USING (published_at IS NOT NULL)`
  sur `articles` et `USING (true)` sur les autres tables publiques.**
  Vérifier régulièrement dans le dashboard Supabase.

### Network / infrastructure
- Ports 8080 (Traefik dashboard), 6379 (Redis), 5432 (Postgres) bloqués via
  `iptables DOCKER-USER` → `-j DROP` (défense en profondeur post-rapport BSI).
  Backup des règles dans `/root/iptables-backup.rules` sur le VPS.
- Caddy/Traefik gère SSL (Let's Encrypt auto).
- Cloudflare en front pour DDoS protection + WAF.
- SSH : clé ed25519, port 22 standard.

### Headers HTTP
- HSTS (2 ans + includeSubDomains + preload)
- **CSP nonce-based** : middleware injecte un nonce par requête via
  `lib/csp-nonce.ts`. `script-src 'self' 'nonce-…' 'strict-dynamic'`,
  plus de `'unsafe-inline'` sur script-src. 20+ JSON-LD <script>
  reçoivent le nonce.
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: caméra/micro/géo désactivés
- Appliqué aussi sur `/api/*` (vérifié en prod).

### Observabilité
- `app/global-error.tsx` : catch les crashs SSR / client.
- `app/api/log-error/route.ts` : reçoit les erreurs + log `[CLIENT_ERROR]`
  sur stderr + alert Telegram (bot + `@foot360news`). Rate-limit
  in-memory avec purge périodique (50/min/IP). Markdown Telegram
  escape pour ne pas casser sur URLs avec underscores.
- Healthcheck Docker → `/api/health` (check Supabase).
- Logging LLM : chaque appel `generateArticle()` log avec préfixe
  `[LLM]` (model, prompt_tokens, cache_hit, output_tokens, duration_ms).
  Opt-out via `LLM_LOG_USAGE=false`.
- Vitest smoke tests dans `__tests__/` : `npm test` (50 tests).
- ✅ Tests E2E Playwright (15 specs dans `e2e/`) : `npm run test:e2e`.
  Couverture : home, match, pronostic, search, syndication, health,
  crash regression, 404. Config dans `playwright.config.ts`.

### LLM / contenu généré
- Migration achevée vers **DeepSeek** (`deepseek-chat`, OpenAI-compatible)
  via `lib/llm.ts`. Plus de dépendance `@anthropic-ai/sdk` côté Next.js
  ni `workers/`. Tarifs DeepSeek (avril 2026) : input 0.14$ / 1M, cache hit
  0.014$ / 1M, output 0.28$ / 1M. `getEstimatedSpendUSD()` distingue
  désormais les cache hits du `prompt_tokens` complets.
- `temperature: 1.3` (recommandation DeepSeek pour news/contenu créatif).
- `response_format: { type: "json_object" }` activé (`jsonMode: true`) sur
  tous les callers qui parsent du JSON (cron generate-articles,
  generate-previews, generate-streaming-articles, scrape-transfers,
  generate-trending). Erreurs de parse loggées avec préfixe
  `[LLM_PARSE_ERROR]` et l'item est skip proprement (pas de crash cron).
- `normalizeTags()` helper : accepte CSV string OU array depuis le LLM,
  retourne toujours `string[]` — fixe le bug Postgres `22P02 malformed
  array literal` qui bloquait `generate-previews`.
- Page auteur **Coffi** (rédacteur en chef éditorial) : voir
  `app/auteurs/coffi/page.tsx` pour le profil public + Person JSON-LD
  riche. Tous les `NewsArticle.author` pointent vers ce `@id`. Photo à
  uploader manuellement dans `public/auteurs/coffi.jpg`.
- `force-dynamic` exporté sur les 19 routes `app/api/cron/*` +
  `track-click` + `generate-trending` (défense contre static
  pre-rendering Next.js).

### API hardening
- `/api/syndication/*` : validation stricte de `limit` et `offset`
  (clampés, pas de leak Supabase sur inputs invalides).
- `safeJsonLd()` : escape `</script>` + `<!--`, degrade vers `"null"` sur
  input invalide au lieu de crasher.
- Write-time normalization dans `/api/cron/enrich-previews` : `winner`,
  `goals`, `home_goals_last5`, `away_goals_last5` sont stockés comme
  strings/numbers, pas comme objets API-Football. Type :
  `lib/types/prediction.ts` → `NormalizedPrediction`.

### SEO technique (audit 27 avril 2026)
- **Hreflang** : 13 `<link rel="alternate" hrefLang>` rendus en HTML pour
  fr, fr-FR, fr-CI, fr-SN, fr-CM, fr-BJ, fr-TG, fr-ML, fr-BF, fr-CD,
  fr-MA, fr-TN + x-default. Cf. `app/layout.tsx`.
- **`og:locale:alternate`** : 10 locales africaines déclarées au niveau
  layout pour cohérence multilingue.
- **`INDEXABLE_ROBOTS`** (constante dans `lib/seo-helpers.ts`) : signal
  positif explicite sur les pages indexables —
  `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1`.
  Critique pour Google Discover sur mobile Afrique.
- **`llms.txt`** servi à `/llms.txt` (route dédiée). Format llmstxt.org
  pour visibilité ChatGPT/Perplexity/Claude/AppleBot.
- **Pages index** `/pronostic`, `/equipe`, `/joueur` ont un H1 conforme
  (avant : H1 absent, défavorisait le ranking sur les hubs).
- **`/selection/{pays}`** : H1 réel "Football {pays} — …" au lieu de
  l'emoji seul. Emoji conservé via `aria-hidden` pour UX.
- **Bookmakers soft-404 fix** : 4 URLs (1xbet, 1win, melbet, megapari)
  retirées de `app/sitemap-static.xml/route.ts` jusqu'à ce que la table
  `bookmakers` soit seedée (NOTE inline dans le code).
- **Redirect** : `/ligue/ligue-1` → 308 → `/ligue/ligue-1-france` dans
  `next.config.mjs`.
- **NewsArticle JSON-LD** enrichi : `articleBody` (extrait propre 800
  chars), `keywords`, `dateModified`, `author` → Person Coffi.
- **SportsTeam / Person schemas** enrichis : `image`, `foundingDate`,
  `location`, `coach`, `affiliation`, `jobTitle`, `url`.
- **Soft-404 thin content** : `noindex` conditionnel sur équipes /
  joueurs / ligues sans data minimum (cf. `lib/seo-helpers.ts`
  `noindexIf`, `MIN_ARTICLES_FOR_INDEX = 3`, `MIN_MATCHES_FOR_INDEX = 1`).
- **Sitemaps** : filtres `slug NOT NULL` + alignement avec règles
  noindex. `sitemap-leagues` n'émet que les sous-URLs qui passeront
  leur check noindex (cohérence sitemap ↔ meta robots).

## 🔄 Dettes techniques connues

### Critiques
- **Soft-404 HTTP 200** pour `/pronostic/[bad-slug]` etc. : bug Next.js 14.2
  avec `revalidate` + `notFound()`. Mitigation : `<meta robots="noindex">`
  servie + `force-dynamic` sur les routes concernées ; Google n'indexera
  pas. Le statut HTTP reste 200 (cosmétique). Upgrade Next.js 15 résoudrait
  définitivement.

### Moyennes
- 93+ `any` / `as any` dans les pages. Le bug pronostic initial venait de
  ça. Priorité : typer `predictions_json` avec `NormalizedPrediction`
  (déjà dispo dans `lib/types/prediction.ts` mais 0 import à ce jour),
  puis matches/teams stats.
- Migration Postgres/Redis auto-hébergé : `docker-compose.yml` les définit
  mais le code parle encore Supabase + Upstash. Soit purger, soit finir
  la migration. Décision business : rester sur Supabase tant que < $25/mo.
- Pas de Sentry / monitoring structuré. Telegram alert est un pis-aller.
- Dedup articles : pipeline d'ingestion peut produire plusieurs articles
  sur le même match (ex: 7 articles OM-Nice détectés à l'audit 27/04).
  À fixer en commit séparé : ajouter check `match_id + window 6h` avant
  insert.

### Faibles
- Pages index `/pronostic`, `/equipe`, `/joueur` créées mais les données
  sont tronquées (limit 200-300). Si le site grossit, ajouter pagination.
- Sources RSS : 17 désactivées (404/403). Ré-audit trimestriel conseillé
  pour voir ce qui est revenu.
- `generate-trending` prompt : stats "saison en cours" retirées + règle
  anti-hallucination dans le SYSTEM_PROMPT — mais le LLM peut encore
  inventer. Monitoring qualité éditoriale nécessaire.
- Pages géo `/pronostic/{pays}` (S4 du plan SEO) : non créées. Levier
  +25-40% trafic Afrique potentiel sur 60-90j.

## 🔐 Rotation de secrets

- Rotation annuelle minimum pour : `SYNDICATION_API_KEY`, `CRON_SECRET`,
  `INDEXNOW_SECRET`, `DEEPSEEK_API_KEY`, `INTERNAL_OPS_KEY`.
- Immédiate si compromise : via `php artisan tinker` dans le container
  `coolify` → delete + recreate `EnvironmentVariable` pour que Coolify
  re-encrypte. Puis redéployer l'app.
- Ne jamais logger ou committer une clé, même "pour debug".

## 🚨 En cas d'incident

1. **Logs docker** : `docker logs <container> --tail 500 | grep -E 'CLIENT_ERROR|Error|LLM_PARSE_ERROR'`
2. **Healthcheck** : `curl https://360-foot.com/api/health`
3. **Healthcheck full** : `curl -H 'x-internal-key: $INTERNAL_OPS_KEY' 'https://360-foot.com/api/health?full=1'`
   pour voir token usage cumulés + spend estimé.
4. **Coolify dashboard** : `https://coolify.360-foot.com`
5. **Rollback** : dans Coolify UI, redéployer le commit précédent.
6. **DB snapshot** : Supabase gère les backups, pas de cron manuel requis.
7. **DeepSeek balance** : `https://platform.deepseek.com/usage`. Si
   "Insufficient Balance" → top-up via PayPal (USD).

## 📊 Score (audit 27 avril 2026)

| Axe | Score | Évolution |
|---|---|---|
| Code | 8/10 | de 4.2 → 8 sur 5 rounds d'audit |
| Prod | 8/10 | de 4.5 → 8 |
| SEO | 8/10 | de 6.1 → 8 (commit `528f859`) |

**Tests** : 50 unit + 12 E2E pass (1 fail pré-existant `african-sources`).
**TypeScript** : strict, 0 erreur.

---

*Dernière mise à jour : 27 avril 2026 — commit `528f859` (SEO + E-E-A-T + backend cleanup).*
