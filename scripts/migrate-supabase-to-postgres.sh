#!/usr/bin/env bash
# ============================================================================
# 360 Foot — Migration Supabase → PostgreSQL self-hosted (Phase 4)
#
# Pré-requis :
#   - Postgres self-hosted déjà déployé sur le CX32
#   - Variables d'env définies (SUPABASE_DB_URL, NEW_PG_URL)
#   - pg_dump et psql installés (apt install postgresql-client)
#
# Usage :
#   export SUPABASE_DB_URL="postgresql://postgres:PWD@db.xxx.supabase.co:5432/postgres"
#   export NEW_PG_URL="postgresql://postgres:PWD@TON_IP:5432/foot360"
#   ./migrate-supabase-to-postgres.sh
# ============================================================================

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok() { echo -e "${GREEN}✓${NC} $1"; }
err() { echo -e "${RED}✗${NC} $1" >&2; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }

# Vérifier les variables
if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
    err "SUPABASE_DB_URL non défini"
    echo "Format : postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres"
    exit 1
fi

if [[ -z "${NEW_PG_URL:-}" ]]; then
    err "NEW_PG_URL non défini"
    echo "Format : postgresql://postgres:PASSWORD@HOST:5432/foot360"
    exit 1
fi

# Vérifier les outils
for cmd in pg_dump psql jq; do
    if ! command -v $cmd &> /dev/null; then
        err "$cmd n'est pas installé. Installe avec : apt install postgresql-client jq"
        exit 1
    fi
done

DUMP_FILE="360foot-$(date +%Y%m%d-%H%M%S).dump"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Migration Supabase → PostgreSQL self-hosted"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ───── 1. Compter les lignes Supabase pour validation ─────────────────────
echo "📊 Comptage des lignes Supabase..."
TABLES="leagues teams players matches articles standings transfers bookmakers affiliate_clicks rss_processed trending_keywords player_id_mapping"

declare -A COUNTS_BEFORE
for table in $TABLES; do
    count=$(psql "$SUPABASE_DB_URL" -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | xargs || echo "N/A")
    COUNTS_BEFORE[$table]=$count
    printf "  %-25s %s\n" "$table" "$count"
done

echo ""
read -p "Continuer avec ces compteurs ? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

# ───── 2. Dump Supabase ───────────────────────────────────────────────────
echo ""
echo "📦 Création du dump Supabase → $DUMP_FILE"
pg_dump "$SUPABASE_DB_URL" \
    --no-owner \
    --no-acl \
    --schema=public \
    --format=custom \
    --file="$DUMP_FILE"
ok "Dump créé ($(du -h "$DUMP_FILE" | cut -f1))"

# ───── 3. Préparer la base destination ─────────────────────────────────────
echo ""
echo "🛠  Préparation de la base destination..."
psql "$NEW_PG_URL" -c "DROP SCHEMA IF EXISTS public CASCADE;" > /dev/null
psql "$NEW_PG_URL" -c "CREATE SCHEMA public;" > /dev/null
ok "Schéma public recréé"

# ───── 4. Restaurer dans la nouvelle DB ───────────────────────────────────
echo ""
echo "♻  Restauration en cours..."
pg_restore "$NEW_PG_URL" \
    --no-owner \
    --no-acl \
    --verbose \
    "$DUMP_FILE" 2>&1 | tail -20
ok "Restauration terminée"

# ───── 5. Créer les rôles équivalents Supabase ────────────────────────────
echo ""
echo "👥 Création des rôles anon, service_role, authenticator..."
psql "$NEW_PG_URL" <<'SQL' > /dev/null
-- Rôle anon (lectures publiques)
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;

-- Rôle service_role (écritures)
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
  END IF;
END $$;

GRANT ALL ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;

-- Rôle authenticator (utilisé par PostgREST)
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'CHANGE_ME_AUTHENTICATOR_PASSWORD';
  END IF;
END $$;

GRANT anon TO authenticator;
GRANT service_role TO authenticator;
SQL
ok "Rôles créés"

# ───── 6. Validation finale ───────────────────────────────────────────────
echo ""
echo "🔍 Validation : comparaison avant/après..."
ALL_OK=true
for table in $TABLES; do
    after=$(psql "$NEW_PG_URL" -t -c "SELECT COUNT(*) FROM public.$table;" 2>/dev/null | xargs || echo "ERROR")
    before=${COUNTS_BEFORE[$table]}
    if [[ "$before" == "$after" ]]; then
        printf "  ${GREEN}✓${NC} %-25s %s = %s\n" "$table" "$before" "$after"
    else
        printf "  ${RED}✗${NC} %-25s %s ≠ %s\n" "$table" "$before" "$after"
        ALL_OK=false
    fi
done

echo ""
if $ALL_OK; then
    ok "Migration réussie ! Toutes les lignes correspondent."
else
    err "Différences détectées — vérifier manuellement avant de basculer"
    exit 1
fi

# ───── 7. Instructions suivantes ──────────────────────────────────────────
echo ""
echo "📝 Étapes suivantes :"
echo ""
echo "  1. Change le mot de passe authenticator :"
echo "     ALTER ROLE authenticator PASSWORD 'mdp_fort';"
echo ""
echo "  2. Déploie PostgREST dans Coolify pour exposer une API REST"
echo "     Image : postgrest/postgrest:latest"
echo "     PGRST_DB_URI=postgresql://authenticator:mdp@postgres:5432/foot360"
echo "     PGRST_JWT_SECRET=\$(openssl rand -base64 32)"
echo ""
echo "  3. Génère les JWT anon et service_role avec ce secret"
echo "     (utilise jwt.io ou un script Node)"
echo ""
echo "  4. Mets à jour les variables d'env de l'app Next.js dans Coolify :"
echo "     NEXT_PUBLIC_SUPABASE_URL=https://api.360-foot.com"
echo "     NEXT_PUBLIC_SUPABASE_ANON_KEY=<jwt anon>"
echo "     SUPABASE_SERVICE_ROLE_KEY=<jwt service_role>"
echo ""
echo "  5. Redéploie l'app et teste"
echo ""
echo "  6. Garde le dump $DUMP_FILE en backup pendant 30 jours"
echo ""
ok "Tout est prêt."
