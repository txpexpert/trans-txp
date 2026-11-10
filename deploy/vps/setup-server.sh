#!/usr/bin/env bash
# deploy/vps/setup-server.sh
# ─────────────────────────────────────────────────────────────────────────────
# Installation initiale du VPS CapConnect (Ubuntu 22.04 / 24.04), à lancer UNE
# fois en root :   sudo bash setup-server.sh
#
# Installe : Node.js 24 (même version que Vercel), nginx, certbot, pm2, pare-feu,
# fichier d'échange (la construction Next.js consomme beaucoup de mémoire).
# Crée l'utilisateur « ixp » et l'arborescence /srv/ixp/{prod,demo}.
# N'active AUCUNE tâche cron (voir README, étape de bascule).
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then echo "À lancer en root (sudo)."; exit 1; fi

echo "→ Fuseau horaire UTC (les horaires cron du site sont exprimés en UTC)"
timedatectl set-timezone UTC || true

echo "→ Paquets système"
apt-get update -y
apt-get upgrade -y
apt-get install -y curl git nginx certbot python3-certbot-nginx ufw ca-certificates gnupg unattended-upgrades

echo "→ Mises à jour de sécurité automatiques"
dpkg-reconfigure -f noninteractive unattended-upgrades || true

echo "→ Node.js 24"
if ! command -v node >/dev/null || ! node -v | grep -q '^v24'; then
  curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
  apt-get install -y nodejs
fi
npm install -g pm2

echo "→ Fichier d'échange de 2 Go (si absent)"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "→ Utilisateur ixp et arborescence"
id ixp >/dev/null 2>&1 || adduser --disabled-password --gecos "" ixp
for ENV in prod demo; do
  mkdir -p /srv/ixp/$ENV/releases /srv/ixp/$ENV/shared
done
mkdir -p /var/log/ixp /srv/ixp/bin
chown -R ixp:ixp /srv/ixp /var/log/ixp

echo "→ Pare-feu : SSH + HTTP/HTTPS uniquement"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "→ Démarrage automatique de pm2 au boot pour l'utilisateur ixp"
env PATH="$PATH:/usr/bin" pm2 startup systemd -u ixp --hp /home/ixp >/dev/null
su - ixp -c "pm2 install pm2-logrotate >/dev/null 2>&1 || true"

echo "→ Clé de déploiement GitHub (lecture seule) pour l'utilisateur ixp"
if [ ! -f /home/ixp/.ssh/id_ed25519 ]; then
  su - ixp -c "mkdir -p ~/.ssh && ssh-keygen -t ed25519 -N '' -C 'ixp-vps-deploy' -f ~/.ssh/id_ed25519 >/dev/null"
  su - ixp -c "ssh-keyscan github.com >> ~/.ssh/known_hosts 2>/dev/null"
fi

echo
echo "✔ Serveur prêt."
echo "  Clé publique à ajouter dans GitHub → trans-txp → Settings → Deploy keys (lecture seule) :"
cat /home/ixp/.ssh/id_ed25519.pub
