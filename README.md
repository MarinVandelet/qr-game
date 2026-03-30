# QR GAME - MMI JPO

Projet web multi-joueurs en temps réel (Socket.IO) pour une journée portes ouvertes MMI.
Le parcours contient 4 épreuves en équipe, avec des transitions automatiques entre les jeux.

## Ce que fait le projet
- Création / rejoindre un salon par code.
- Synchronisation temps réel entre les joueurs.
- Épreuve 1: Quiz découverte.
- Épreuve 2: Mots QR + puzzle d'association MMI.
- Épreuve 3: Enigmes (10 réponses à trouver).
- Épreuve 4: Quiz final.
- Page de fin avec score global sur 100.

## Stack technique
- Frontend: React + Vite
- Backend: Node.js + Express + Socket.IO
- DB locale: SQLite (better-sqlite3)
- Déploiement conseillé: Nginx + PM2 sur Ubuntu

## Arborescence rapide
- `frontend/` interface React
- `backend/` API + sockets + logique des jeux
- `deploy/` exemple conf Nginx + script de deploiment

## Lancer en local
### 1) Prérequis
- Node.js 20+
- npm

### 2) Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Exemple de `.env` backend:
```env
PORT=4000
CORS_ORIGIN=http://localhost:5173
```

### 3) Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Exemple de `.env` frontend:
```env
VITE_API_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
```

### 4) Ouvrir le projet
- Front: `http://localhost:5173`
- API: `http://localhost:4000`

## Déployer sur un VPS Ubuntu
### 1) Préparer la machine
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git
sudo npm install -g pm2
```

### 2) Récupérer le repo
```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/MarinVandelet/qr-game.git
sudo chown -R $USER:$USER /var/www/qr-game
```

### 3) Configurer le backend
```bash
cd /var/www/qr-game/backend
npm ci
cat > .env << 'EOF'
PORT=4000
CORS_ORIGIN=http://VOTRE_IP_OU_DOMAINE
EOF
pm2 start ecosystem.config.cjs --name qr-game-backend
pm2 save
```

### 4) Build du frontend
```bash
cd /var/www/qr-game/frontend
npm ci
cat > .env << 'EOF'
VITE_API_URL=http://VOTRE_IP_OU_DOMAINE
VITE_SOCKET_URL=http://VOTRE_IP_OU_DOMAINE
EOF
npm run build
```

### 5) Config Nginx
Copiez `deploy/nginx-qr-game.conf` vers `/etc/nginx/sites-available/qr-game`, puis activez:

```bash
sudo ln -sf /etc/nginx/sites-available/qr-game /etc/nginx/sites-enabled/qr-game
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 6) Vérifs utiles
```bash
curl http://127.0.0.1:4000/
pm2 status
sudo systemctl status nginx
```

## Mise à jour future (workflow simple)
Quand tu push sur GitHub, sur le VPS:

```bash
cd /var/www/qr-game
git pull --rebase
cd backend && npm ci && pm2 restart qr-game-backend --update-env
cd ../frontend && npm ci && npm run build
sudo systemctl reload nginx
```

## Notes importantes
- Les fichiers `.env` ne doivent pas être versionnés.
- Si tu changes les variables d'env backend, fais `pm2 restart ... --update-env`.
- Si tu vois encore des anciennes versions côté navigateur, vide le cache.
