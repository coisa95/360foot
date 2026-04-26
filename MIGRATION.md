# Migration 360 Foot — Vercel → Hetzner CX32 + Coolify

Guide complet de migration de l'infrastructure de 360-foot.com depuis Vercel + Render + Supabase vers un déploiement self-hosted sur un VPS Hetzner CX32 avec Coolify.

## Architecture cible

```
Cloudflare (DNS + CDN + WAF)
    │
    ▼
Hetzner CX32 (4 vCPU / 8 GB RAM)
├── Coolify (panneau)
├── Caddy / Traefik (SSL auto)
├── Next.js standalone (port 3000)
├── og-service Express (port 3001)
├── Worker cron node-cron
├── PostgreSQL 16 (Phase 4)
└── Redis 7
```

## Économies attendues

| Poste | Avant | Après |
|---|---|---|
| Vercel Pro | $20/mo | $0 |
| Supabase Pro | $25/mo | $0 (Phase 4) |
| Render | gratuit (mais sleep) | $0 |
| Upstash | gratuit/PAYG | $0 |
| Hetzner Storage Box | - | €3.81/mo |
| **Total** | **~$45-65/mo** | **~€4/mo** |

---

## Phase 0 — Préparation (15 min)

### 0.1 Prérequis

- ✅ Accès root SSH au CX32 Hetzner
- ✅ Domaine 360-foot.com géré sur Cloudflare
- ✅ Tous les secrets actuels (Supabase, API-Football, DeepSeek, Telegram, etc.)
- ✅ `.env.production` actuel sauvegardé dans un gestionnaire de mots de passe

### 0.2 Liste des secrets à transférer

Voir `.env.example` pour la liste complète. Variables critiques :

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DEEPSEEK_API_KEY
API_FOOTBALL_KEY
CRON_SECRET
TELEGRAM_BOT_TOKEN
TELEGRAM_CHANNEL_ID
PEXELS_API_KEY
UNSPLASH_ACCESS_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

---

## Phase 1 — Setup VPS + Coolify (30 min)

### 1.1 Connexion SSH

```bash
ssh root@TON_IP_HETZNER
```

### 1.2 Installation automatique

Une seule commande :

```bash
curl -fsSL https://raw.githubusercontent.com/coisa95/360foot/master/scripts/setup-vps.sh | bash
```

Ce script :
- Met à jour le système
- Installe les paquets de base
- Configure UFW (firewall)
- Active fail2ban
- Configure les mises à jour automatiques
- **Installe Coolify**

### 1.3 Premier login Coolify

1. Ouvre `http://TON_IP:8000`
2. Crée le compte admin
3. **Active le 2FA** (Settings → Profile)

### 1.4 Sécuriser Coolify avec HTTPS

1. **Cloudflare** → DNS → Add record :
   - Type : `A`
   - Name : `coolify`
   - IPv4 : `TON_IP`
   - Proxy : **DNS only** (gris)

2. **Coolify** → Settings → Configuration :
   - Instance Domain : `https://coolify.360-foot.com`

3. Attendre 1-2 min (Let's Encrypt)

4. Accès désormais via `https://coolify.360-foot.com`

### 1.5 Provisionner Postgres + Redis

**PostgreSQL :**
- Resources → New → Database → PostgreSQL 16
- Name : `360foot-db`
- Memory limit : 3072 MB
- Public : OFF
- Save → Start

**Redis :**
- Resources → New → Database → Redis 7
- Name : `360foot-redis`
- Memory limit : 512 MB
- Public : OFF
- Save → Start

---

## Phase 2 — Déployer les apps (1h)

À cette étape, on déploie 3 services Node sur le VPS, **mais ils continuent d'utiliser Supabase comme DB** (zero risk).

### 2.1 Application Next.js

1. **Projects → New** → `360foot`
2. **+ Add Resource → Application → Public Repository**
3. Repository : `https://github.com/coisa95/360foot`
4. Branch : `master`
5. **Build Pack** : Dockerfile
6. **Dockerfile location** : `/Dockerfile`
7. **Port** : 3000
8. **Environment Variables** : copier toutes les variables du `.env.example`
9. **Domains** : laisser vide pour l'instant
10. **Deploy**

Premier build : 5-10 min.

### 2.2 og-service

1. **+ Add Resource → Application → Public Repository**
2. Mêmes paramètres que ci-dessus, sauf :
   - **Base directory** : `/og-service`
   - **Dockerfile location** : `/og-service/Dockerfile`
   - **Port** : 3001
   - Pas de variables d'env nécessaires

### 2.3 Worker cron

1. **+ Add Resource → Application → Public Repository**
2. Paramètres :
   - **Base directory** : `/workers`
   - **Dockerfile location** : `/workers/Dockerfile`
   - **Port** : aucun
3. Variables d'env :
   ```
   CRON_SECRET=...
   APP_URL=https://360-foot.com
   SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

### 2.4 Tester sur staging

Coolify assigne automatiquement un sous-domaine de test. Tu peux aussi :

1. Cloudflare → Add record :
   - Type : `A`
   - Name : `staging`
   - IPv4 : `TON_IP`
   - Proxy : DNS only
2. Coolify → app Next.js → Domains → `staging.360-foot.com`
3. Tester : `https://staging.360-foot.com`

**Tests à faire avant la bascule :**
```bash
curl -I https://staging.360-foot.com/
curl -I https://staging.360-foot.com/sitemap.xml
curl -I https://staging.360-foot.com/actu
curl -I https://staging.360-foot.com/match/n-importe-quel-slug
curl -I https://staging.360-foot.com/go/1xbet
curl -s https://staging.360-foot.com/sitemap-articles.xml | grep -c "<loc>"
# Doit retourner 1633 ou plus
```

---

## Phase 3 — Bascule DNS (30 min + 48h obs)

### 3.1 Pré-bascule (1h avant)

1. Cloudflare → DNS → record A `360-foot.com` → **Edit**
2. **TTL** : passer à `1 minute` (60s)
3. **Save** et attendre 1h

### 3.2 Bascule

1. Cloudflare → DNS → record A `360-foot.com` :
   - Content : **TON_IP** (CX32)
   - Proxy : **Proxied** (orange) → CDN + WAF Cloudflare
   - TTL : Auto
2. Idem pour `www.360-foot.com`
3. Coolify → app Next.js → Domains → ajouter `360-foot.com` et `www.360-foot.com`
4. Attendre ~1 min (SSL Let's Encrypt)

### 3.3 Vérifications immédiates

```bash
dig 360-foot.com
curl -I https://360-foot.com
curl -I https://360-foot.com/sitemap.xml
```

### 3.4 Garder Vercel actif 48h

Ne **PAS** supprimer le projet Vercel pendant 48h. En cas de bug critique : remettre l'IP Vercel dans Cloudflare = rollback en 5 min.

### 3.5 J+2 — Cleanup

- Vercel : Settings → Pause Project (pas Delete)
- Render : pause des deux services (cron worker + og-service)

---

## Phase 4 — Migration Postgres (optionnelle, J+7)

À faire **après** que Phase 3 ait tourné stable pendant 1 semaine.

### 4.1 Préparer

```bash
# Sur ton VPS
apt install -y postgresql-client jq
```

### 4.2 Lancer la migration

```bash
export SUPABASE_DB_URL="postgresql://postgres:PWD@db.vplejedemagidkqbxfqr.supabase.co:5432/postgres"
export NEW_PG_URL="postgresql://postgres:PWD@360foot-db:5432/postgres"

curl -fsSL https://raw.githubusercontent.com/coisa95/360foot/master/scripts/migrate-supabase-to-postgres.sh -o migrate.sh
chmod +x migrate.sh
./migrate.sh
```

Le script :
- Compte les lignes Supabase
- Dump la base
- Recrée le schéma sur le nouveau Postgres
- Restaure le dump
- Crée les rôles `anon`, `service_role`, `authenticator`
- Valide que les comptes correspondent

### 4.3 Déployer PostgREST

PostgREST permet à ton code Supabase JS de continuer à fonctionner sans modification.

Coolify :
1. **+ Add Resource → Service → Custom Docker Image**
2. Image : `postgrest/postgrest:latest`
3. Variables d'env :
   ```
   PGRST_DB_URI=postgresql://authenticator:PWD@360foot-db:5432/postgres
   PGRST_DB_SCHEMAS=public
   PGRST_DB_ANON_ROLE=anon
   PGRST_JWT_SECRET=<openssl rand -base64 32>
   PGRST_DB_POOL=10
   ```
4. **Domain** : `api.360-foot.com`
5. Deploy

### 4.4 Générer les JWT

Sur https://jwt.io ou avec un script Node :

```javascript
// Token anon (lecture publique)
const jwt = require('jsonwebtoken');
const SECRET = "le-meme-que-PGRST_JWT_SECRET";
console.log("ANON:", jwt.sign({ role: 'anon' }, SECRET, { expiresIn: '10y' }));
console.log("SERVICE:", jwt.sign({ role: 'service_role' }, SECRET, { expiresIn: '10y' }));
```

### 4.5 Bascule

Dans Coolify, app Next.js → Environment :
```
NEXT_PUBLIC_SUPABASE_URL=https://api.360-foot.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=<jwt anon>
SUPABASE_SERVICE_ROLE_KEY=<jwt service_role>
```

Redéployer.

### 4.6 Validation

```bash
curl -s https://360-foot.com/sitemap-articles.xml | grep -c "<loc>"
# Doit toujours retourner 1633
```

### 4.7 Cleanup Supabase

Après 7 jours de stabilité : pause du projet Supabase. Supprimer après 30 jours.

---

## Phase 5 — Durcissement (2h)

### 5.1 Backups Postgres

**Option A : Coolify natif (simple)**
- Postgres → Backups → Configure
- Schedule : `0 3 * * *`
- Retention : 7 daily + 4 weekly + 3 monthly

**Option B : Hetzner Storage Box (pro)**
1. Acheter Storage Box 1 TB (€3.81/mo)
2. Installer pgBackRest dans un container Coolify
3. Backups full hebdo + incrémental quotidien

### 5.2 Monitoring

Coolify → Settings → Monitoring → Enable
- Grafana + Prometheus inclus
- Alertes email sur :
  - Disk > 80%
  - RAM > 90%
  - Container down > 5 min
  - Cron job failed

### 5.3 Sécurité SSH

```bash
# Désactiver login root par mot de passe
nano /etc/ssh/sshd_config
# PermitRootLogin prohibit-password
# PasswordAuthentication no
systemctl restart sshd
```

### 5.4 Fermer le port 8000 (Coolify accessible via HTTPS)

```bash
ufw delete allow 8000/tcp
```

### 5.5 Replace cron worker by Coolify Scheduled Tasks

Sur l'app Next.js dans Coolify :
- Scheduled Tasks → Add
- Pour chaque cron du worker actuel :
  ```
  Name: collect-matches
  Command: curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/collect-matches
  Schedule: 0 * * * *
  ```

→ Une fois tous les crons migrés, supprimer le service `worker`.

---

## Plan de rollback

| Phase | Rollback |
|---|---|
| 2 — Apps déployées | Aucun, prod toujours sur Vercel |
| 3 — DNS basculé | Cloudflare → record A → IP Vercel (5 min) |
| 4 — DB migrée | Variables env retour Supabase URL, redéployer |
| 5 — Durcissement | Sans impact |

---

## Checklist finale

```
PHASE 0
[ ] Secrets exportés
[ ] Cloudflare configuré (DNS pointe encore Vercel)

PHASE 1
[ ] setup-vps.sh exécuté
[ ] Coolify accessible via HTTPS
[ ] Postgres + Redis up

PHASE 2
[ ] Next.js déployé sur Coolify
[ ] og-service déployé
[ ] Worker déployé
[ ] Tests staging.360-foot.com OK

PHASE 3
[ ] DNS basculé
[ ] SSL Let's Encrypt OK
[ ] Tests production OK
[ ] Vercel mis en pause après J+2

PHASE 4 (optionnelle)
[ ] Migration script exécuté
[ ] Comptes par table identiques
[ ] PostgREST déployé + tests
[ ] Variables env mises à jour
[ ] J+7 stable
[ ] Supabase pause activée

PHASE 5
[ ] Backups automatiques actifs
[ ] Monitoring configuré
[ ] SSH durci
[ ] Port 8000 fermé
```

---

## Support / dépannage

- Logs Coolify : `https://coolify.360-foot.com` → app → Logs
- Logs Caddy : `docker logs foot360-caddy`
- Logs Postgres : Coolify → Postgres → Logs
- Status containers : `docker ps -a` sur le VPS
- Restart d'urgence : Coolify → app → Restart
