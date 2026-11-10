# Migration de Vercel vers un VPS CapConnect

Ce dossier contient tout ce qu'il faut pour faire tourner Import-eXPert sur un
VPS, à côté de Vercel, puis basculer sans coupure. **Tant que l'étape 6
n'est pas faite, le site public reste servi par Vercel.**

| Fichier | Rôle |
|---|---|
| `setup-server.sh` | Installation initiale du serveur (une fois, en root) |
| `deploy.sh` | Mise en ligne d'une version (`prod` ou `demo`), avec retour arrière automatique |
| `ecosystem.config.js` | Processus pm2 : production (port 3000) et démo (port 3001) |
| `nginx/ixp.conf` | Domaines, redirections vers www, HTTPS, IP réelle des visiteurs |
| `cron-expire-subscriptions.sh` | Remplace la tâche planifiée de `vercel.json` |
| `env.example` | Liste des variables d'environnement à recopier depuis Vercel |
| `../../.github/workflows/deploy-vps.yml` | Bouton de mise en ligne depuis GitHub |

## Ce qui reste hors du VPS

Supabase (base de données et fichiers), Upstash, Resend et les API d'IA ne
bougent pas : seul l'exécution du site change de place.

## 1. Commander le VPS

- Ubuntu 22.04 ou 24.04, **sans cPanel**
- 2 vCPU, **4 Go de RAM** minimum (la construction Next.js en consomme ~2 Go),
  40 Go de disque SSD
- Option sauvegarde externe recommandée

## 2. Installer le serveur

Le dépôt étant privé, le serveur ne peut pas le télécharger avant d'avoir
sa clé. On procède donc en deux temps.

**a. Script d'installation** : se connecter, créer le fichier et y coller le
contenu de `setup-server.sh` (puis Ctrl-D), et le lancer.

```bash
ssh root@IP_DU_VPS
cat > /root/setup-server.sh      # coller le contenu, puis Ctrl-D
bash /root/setup-server.sh
```

Le script affiche une clé publique : l'ajouter dans GitHub → trans-txp →
Settings → **Deploy keys** (lecture seule).

**b. Outils de déploiement** : une fois la clé ajoutée.

```bash
sudo -u ixp git clone --depth 1 git@github.com:txpexpert/trans-txp.git /tmp/ixp
cp /tmp/ixp/deploy/vps/{deploy.sh,ecosystem.config.js,cron-expire-subscriptions.sh} /srv/ixp/bin/
chmod +x /srv/ixp/bin/*.sh && chown -R ixp:ixp /srv/ixp/bin
```

Ces commandes supposent que ce dossier est déjà fusionné dans `main`. Cette
fusion n'a aucun effet sur Vercel : elle ajoute seulement des fichiers.

## 3. Variables d'environnement

Pour `prod` et `demo` : créer `/srv/ixp/<env>/shared/.env.production` à
partir de `env.example`, avec les valeurs de Vercel.

```bash
sudo -u ixp nano /srv/ixp/prod/shared/.env.production
sudo chmod 600 /srv/ixp/*/shared/.env.production
```

Pour la démo, `NEXT_PUBLIC_SITE_URL=https://demo.import-ia.ma`.

## 4. Première mise en ligne et nginx

```bash
sudo -u ixp /srv/ixp/bin/deploy.sh prod
sudo -u ixp /srv/ixp/bin/deploy.sh demo
sudo cp /tmp/ixp/deploy/vps/nginx/ixp.conf /etc/nginx/sites-available/ixp.conf
sudo ln -s /etc/nginx/sites-available/ixp.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

## 5. Essai sur test.import-ia.ma (le site public n'est pas touché)

1. Chez CapConnect, zone **import-ia.ma** : enregistrement `A`, nom `test`,
   valeur = IP du VPS.
2. Certificat : `sudo certbot --nginx -d test.import-ia.ma`
3. Vérifier sur https://test.import-ia.ma : accueil, connexion, un module
   payant, une question à l'IA, un envoi de fichier, le back-office.

⚠ Ce site d'essai utilise la vraie base Supabase : une inscription ou un
paiement fait dessus est réel.

## 6. Bascule

À faire à un moment calme.

1. **La veille** : chez CapConnect, baisser le TTL des enregistrements `A` et
   `CNAME www` d'import-expert.ma et d'import-ia.com à 300 secondes.
2. **Le jour J** :
   - remplacer la valeur des enregistrements `A @` par l'IP du VPS, et les
     `CNAME www` par un `A www` vers la même IP (pour les deux domaines) ;
   - quelques minutes plus tard :
     `sudo certbot --nginx -d import-expert.ma -d www.import-expert.ma -d import-ia.com -d www.import-ia.com`
   - activer le cron sur le VPS (`sudo -u ixp crontab -e`, ligne indiquée
     dans `cron-expire-subscriptions.sh`) **et** retirer `crons` de
     `vercel.json` le même jour : sinon les relances de facturation partent
     en double.
3. **Retour arrière** si besoin : remettre les anciennes valeurs DNS. Vercel
   tourne toujours et reprend la main en quelques minutes.
4. Après quelques jours sans incident : réactiver le déclenchement `push`
   dans `.github/workflows/deploy-vps.yml`, puis arrêter le projet Vercel.

## Démo

Pour pointer demo.import-ia.ma vers le VPS : remplacer le `CNAME demo` (vers
Vercel) par un `A demo` vers l'IP du VPS, puis
`sudo certbot --nginx -d demo.import-ia.ma`.

## Commandes utiles

```bash
sudo -u ixp pm2 status                 # état des deux sites
sudo -u ixp pm2 logs ixp-prod          # journaux en direct
tail -f /var/log/ixp/cron.log          # tâche quotidienne
ls /srv/ixp/prod/releases              # versions conservées
```

Revenir à la version précédente à la main :

```bash
cd /srv/ixp/prod && ls -1dt releases/*/      # repérer la version voulue
sudo -u ixp ln -sfn /srv/ixp/prod/releases/<version> current
sudo -u ixp pm2 reload ixp-prod
```
