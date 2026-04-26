# Security & Operations — 360foot

État sécurité de l'app après l'audit d'avril 2026. Ce document liste les
mesures en place et les dettes restantes. À mettre à jour quand une
dette est payée.

## ✅ Mesures en place

### Authentification & secrets
- `SYNDICATION_API_KEY` : vérifié via `crypto.timingSafeEqual` (pas de timing
  attack). Voir `lib/syndication-auth.ts`.
- `INDEXNOW_SECRET` / `INDEXNOW_KEY` : plus de fallback hardcodé ; endpoint
  répond 500 si env vars manquantes.
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
- Port 8080 (Traefik dashboard) bloqué via `iptables DOCKER-USER` → `-j DROP`.
  Backup des règles dans `/root/iptables-backup.rules` sur le VPS.
- Caddy/Traefik gère SSL (Let's Encrypt auto).
- Cloudflare en front pour DDoS protection + WAF.
- SSH : clé ed25519, port 22 standard.

### Headers HTTP
- HSTS (2 ans + includeSubDomains + preload)
- CSP avec `frame-ancestors 'none'`, `object-src 'none'`
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: caméra/micro/géo désactivés
- Appliqué aussi sur `/api/*` (vérifié en prod).

### Observabilité
- `app/global-error.tsx` : catch les crashs SSR / client.
- `app/api/log-error/route.ts` : reçoit les erreurs + log `[CLIENT_ERROR]`
  sur stderr + alert Telegram (bot + `@foot360news`).
- Healthcheck Docker → `/api/health` (check Supabase).
- Vitest smoke tests dans `__tests__/` : run `npm test`.

### API hardening
- `/api/syndication/*` : validation stricte de `limit` et `offset`
  (clampés, pas de leak Supabase sur inputs invalides).
- `safeJsonLd()` : escape `</script>` + `<!--`, degrade vers `"null"` sur
  input invalide au lieu de crasher.
- Write-time normalization dans `/api/cron/enrich-previews` : `winner` et
  `goals` sont stockés comme strings, pas comme objets API-Football.
  Type : `lib/types/prediction.ts` → `NormalizedPrediction`.

## 🔄 Dettes techniques connues

### Critiques
- **Aucun test E2E** (Playwright absent). Les smoke tests Vitest couvrent
  quelques helpers purs mais pas les pages réelles.
- **Soft-404 HTTP 200** pour `/pronostic/[bad-slug]` etc. : bug Next.js 14.2
  avec `revalidate` + `notFound()`. Mitigation : `<meta robots="noindex">`
  servie ; Google n'indexera pas. Upgrade Next.js recommandé.
- **`'unsafe-inline'` dans CSP `script-src`** : requis par Next.js hydration
  inline. Migration vers nonce-based CSP recommandée (voir Next.js docs).

### Moyennes
- 93+ `any` / `as any` dans les pages. Le bug pronostic initial venait de
  ça. Priorité : typer `predictions_json` avec `NormalizedPrediction`
  (déjà dispo dans `lib/types/prediction.ts`), puis matches/teams stats.
- Migration Postgres/Redis auto-hébergé : `docker-compose.yml` les définit
  mais le code parle encore Supabase + Upstash. Soit purger, soit finir
  la migration.
- Pas de Sentry / monitoring structuré. Telegram alert est un pis-aller.

### Faibles
- Pages index `/pronostic`, `/equipe`, `/joueur` créées mais les données
  sont tronquées (limit 200-300). Si le site grossit, ajouter pagination.
- Sources RSS : 17 désactivées (404/403). Ré-audit trimestriel conseillé
  pour voir ce qui est revenu.
- `generate-trending` prompt : stats "saison en cours" retirées mais le
  LLM peut encore inventer — monitoring qualité éditoriale nécessaire.

## 🔐 Rotation de secrets

- Rotation annuelle minimum pour : `SYNDICATION_API_KEY`, `CRON_SECRET`,
  `INDEXNOW_SECRET`, `DEEPSEEK_API_KEY`.
- Immédiate si compromise : via `php artisan tinker` dans le container
  `coolify` → delete + recreate `EnvironmentVariable` pour que Coolify
  re-encrypte. Puis redéployer l'app.
- Ne jamais logger ou committer une clé, même "pour debug".

## 🚨 En cas d'incident

1. Logs docker : `docker logs <container> --tail 500 | grep -E 'CLIENT_ERROR|Error'`
2. Healthcheck : `curl https://360-foot.com/api/health`
3. Coolify dashboard : `https://coolify.360-foot.com`
4. Rollback : dans Coolify UI, redéployer le commit précédent.
5. DB snapshot : Supabase gère les backups, pas de cron manuel requis.

---

*Dernière mise à jour : avril 2026 (audit Claude).*
