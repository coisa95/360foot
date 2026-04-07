#!/usr/bin/env bash
# ============================================================================
# backup-supabase.sh — Daily pg_dump of Supabase → local + (optional) S3
# ============================================================================
# Objectif : ne PLUS dépendre des backups Supabase (qui sont désactivés sur le
# plan Free et qui ne sont plus prioritaires maintenant qu'on migre hors-Vercel).
#
# Installation sur la VPS Hetzner :
#   1. Copier ce fichier dans /opt/360foot/backup-supabase.sh
#   2. chmod +x /opt/360foot/backup-supabase.sh
#   3. Créer /etc/360foot/backup.env avec :
#        SUPABASE_DB_URL=postgres://postgres.<project>:<password>@aws-0-eu-west-3.pooler.supabase.com:5432/postgres
#        BACKUP_DIR=/var/backups/360foot
#        RETENTION_DAYS=14
#        HEALTHCHECK_URL=https://hc-ping.com/<uuid>   # optionnel
#   4. Ajouter au crontab root :
#        0 3 * * * /opt/360foot/backup-supabase.sh >> /var/log/360foot-backup.log 2>&1
# ============================================================================
set -euo pipefail

ENV_FILE="${BACKUP_ENV_FILE:-/etc/360foot/backup.env}"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

: "${SUPABASE_DB_URL:?SUPABASE_DB_URL missing}"
: "${BACKUP_DIR:=/var/backups/360foot}"
: "${RETENTION_DAYS:=14}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"
OUT_FILE="${BACKUP_DIR}/supabase-${TIMESTAMP}.sql.gz"
LOG_PREFIX="[backup ${TIMESTAMP}]"

echo "${LOG_PREFIX} start"

# Notify healthchecks.io (start)
if [[ -n "${HEALTHCHECK_URL:-}" ]]; then
  curl -fsS --retry 3 "${HEALTHCHECK_URL}/start" > /dev/null || true
fi

# Dump + gzip + checksum. --no-owner/--no-privileges pour restauration facile.
# --exclude-table-data pour les tables éphémères (sessions, rate-limit).
if ! pg_dump \
      --no-owner \
      --no-privileges \
      --format=plain \
      --exclude-table-data='auth.audit_log_entries' \
      --exclude-table-data='auth.flow_state' \
      --exclude-table-data='auth.sessions' \
      "$SUPABASE_DB_URL" \
      | gzip -9 > "$OUT_FILE"
then
  echo "${LOG_PREFIX} ERROR pg_dump failed" >&2
  if [[ -n "${HEALTHCHECK_URL:-}" ]]; then
    curl -fsS --retry 3 --data-binary "pg_dump failed" "${HEALTHCHECK_URL}/fail" > /dev/null || true
  fi
  exit 1
fi

SIZE=$(stat -c%s "$OUT_FILE" 2>/dev/null || stat -f%z "$OUT_FILE")
sha256sum "$OUT_FILE" > "${OUT_FILE}.sha256"

echo "${LOG_PREFIX} wrote $OUT_FILE (${SIZE} bytes)"

# Retention: drop dumps older than RETENTION_DAYS
find "$BACKUP_DIR" -type f -name 'supabase-*.sql.gz' -mtime +"${RETENTION_DAYS}" -delete
find "$BACKUP_DIR" -type f -name 'supabase-*.sql.gz.sha256' -mtime +"${RETENTION_DAYS}" -delete

# Optional: push to Hetzner Storage Box via rclone
if [[ -n "${RCLONE_REMOTE:-}" ]]; then
  if rclone copy "$OUT_FILE" "${RCLONE_REMOTE}" --quiet; then
    echo "${LOG_PREFIX} uploaded to ${RCLONE_REMOTE}"
  else
    echo "${LOG_PREFIX} WARNING rclone upload failed" >&2
  fi
fi

# Notify healthchecks.io (success)
if [[ -n "${HEALTHCHECK_URL:-}" ]]; then
  curl -fsS --retry 3 --data-binary "ok size=${SIZE}" "${HEALTHCHECK_URL}" > /dev/null || true
fi

echo "${LOG_PREFIX} done"
