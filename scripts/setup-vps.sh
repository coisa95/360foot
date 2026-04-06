#!/usr/bin/env bash
# ============================================================================
# 360 Foot — Setup automatique VPS Hetzner pour Coolify
#
# Usage (en tant que root sur le CX32) :
#   curl -fsSL https://raw.githubusercontent.com/coisa95/360foot/master/scripts/setup-vps.sh | bash
#
# Ou en mode interactif :
#   wget https://raw.githubusercontent.com/coisa95/360foot/master/scripts/setup-vps.sh
#   chmod +x setup-vps.sh
#   ./setup-vps.sh
# ============================================================================

set -euo pipefail

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1"; }
ok() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
err() { echo -e "${RED}✗${NC} $1" >&2; }

# Vérifier qu'on est root
if [[ $EUID -ne 0 ]]; then
   err "Ce script doit être exécuté en root (sudo)"
   exit 1
fi

# Vérifier qu'on est sur Debian/Ubuntu
if ! command -v apt-get &> /dev/null; then
    err "Ce script nécessite Debian ou Ubuntu (apt-get)"
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  360 Foot — Setup VPS automatique pour Coolify"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ───── Étape 1 : Mise à jour système ───────────────────────────────────────
log "Étape 1/6 : Mise à jour du système..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
ok "Système à jour"

# ───── Étape 2 : Installer dépendances de base ─────────────────────────────
log "Étape 2/6 : Installation des paquets de base..."
apt-get install -y -qq \
    curl \
    wget \
    git \
    ufw \
    fail2ban \
    htop \
    ca-certificates \
    gnupg \
    lsb-release \
    unattended-upgrades \
    apt-listchanges \
    jq
ok "Paquets installés"

# ───── Étape 3 : Configurer le firewall ────────────────────────────────────
log "Étape 3/6 : Configuration du firewall UFW..."
ufw --force reset > /dev/null
ufw default deny incoming > /dev/null
ufw default allow outgoing > /dev/null
ufw allow 22/tcp comment 'SSH' > /dev/null
ufw allow 80/tcp comment 'HTTP (Let'"'"'s Encrypt)' > /dev/null
ufw allow 443/tcp comment 'HTTPS' > /dev/null
ufw allow 443/udp comment 'HTTP/3' > /dev/null
ufw allow 8000/tcp comment 'Coolify (à fermer après setup)' > /dev/null
echo "y" | ufw enable > /dev/null
ok "Firewall actif (22, 80, 443, 8000)"

# ───── Étape 4 : Activer fail2ban ──────────────────────────────────────────
log "Étape 4/6 : Activation fail2ban..."
systemctl enable --now fail2ban > /dev/null 2>&1
ok "Fail2ban actif"

# ───── Étape 5 : Mises à jour automatiques ─────────────────────────────────
log "Étape 5/6 : Configuration des mises à jour automatiques..."
cat > /etc/apt/apt.conf.d/20auto-upgrades <<EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF
ok "Updates auto activées"

# ───── Étape 6 : Installer Coolify ─────────────────────────────────────────
log "Étape 6/6 : Installation de Coolify (peut prendre 5-10 min)..."
echo ""
warn "Coolify va installer Docker, Docker Compose, et son propre runtime."
echo ""

if command -v docker &> /dev/null; then
    warn "Docker déjà installé, Coolify utilisera l'instance existante"
fi

curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# ───── Récapitulatif ───────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
ok "Installation terminée avec succès !"
echo "═══════════════════════════════════════════════════════════════"
echo ""

PUBLIC_IP=$(curl -s -4 ifconfig.me || echo "TON_IP")

echo "📋 Étapes suivantes :"
echo ""
echo "  1. Ouvre ton navigateur :"
echo "     http://${PUBLIC_IP}:8000"
echo ""
echo "  2. Crée le compte admin Coolify"
echo ""
echo "  3. Active le 2FA dans Settings → Profile"
echo ""
echo "  4. Configure ton sous-domaine HTTPS :"
echo "     - Cloudflare DNS : A record 'coolify' → ${PUBLIC_IP} (DNS only, gris)"
echo "     - Coolify Settings → Instance Domain → https://coolify.360-foot.com"
echo ""
echo "  5. Provisionner Postgres + Redis (Resources → New → Database)"
echo ""
echo "  6. Déployer Next.js depuis le repo GitHub :"
echo "     https://github.com/coisa95/360foot"
echo ""
echo "📊 Stats du serveur :"
echo "  CPU      : $(nproc) cores"
echo "  RAM      : $(free -h | awk '/^Mem:/ {print $2}')"
echo "  Disk     : $(df -h / | awk 'NR==2 {print $4}') libres"
echo "  IP       : ${PUBLIC_IP}"
echo "  Hostname : $(hostname)"
echo ""
echo "🔒 Sécurité :"
echo "  Firewall : actif (UFW)"
echo "  Fail2ban : actif"
echo "  Updates  : automatiques"
echo ""
echo "⏱  Temps total : ~10 minutes"
echo ""
