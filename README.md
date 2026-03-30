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

## Technologies utilisées (avec logos)

### Frontend
- ![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=white&style=for-the-badge)
- ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white&style=for-the-badge)
- ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white&style=for-the-badge)
- ![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?logo=framer&logoColor=white&style=for-the-badge)

### Backend
- ![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white&style=for-the-badge)
- ![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white&style=for-the-badge)
- ![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?logo=socketdotio&logoColor=white&style=for-the-badge)
- ![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white&style=for-the-badge)

### Déploiement / infra
- ![Nginx](https://img.shields.io/badge/Nginx-009639?logo=nginx&logoColor=white&style=for-the-badge)
- ![PM2](https://img.shields.io/badge/PM2-2B037A?logo=pm2&logoColor=white&style=for-the-badge)
- ![Ubuntu](https://img.shields.io/badge/Ubuntu-E95420?logo=ubuntu&logoColor=white&style=for-the-badge)
- ![GitHub](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white&style=for-the-badge)

## Équipe projet
- Zeinabou Bal
- Sheinez Ben-boubaker
- Marin Vandelet
- Makine Mhoumadi

## Arborescence rapide
- `frontend/` interface React
- `backend/` API + sockets + logique des jeux
- `deploy/` exemple conf Nginx + script de deploiement

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

## Petit rappel
Projet fait pour être simple à maintenir par une équipe étudiante: code direct, logique lisible, peu de dépendances exotiques.
