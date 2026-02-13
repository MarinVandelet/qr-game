# GitHub + VPS (Ubuntu) Deployment Guide

## 1) Convert this folder into one Git repo (Windows, local)

You currently have nested `.git` folders inside `frontend/` and `backend/`.
Remove them first, then initialize git at root.

```powershell
cd "C:\Users\PC\Downloads\QR GAME"
Remove-Item -Recurse -Force frontend\.git
Remove-Item -Recurse -Force backend\.git

git init
git add .
git commit -m "Initial commit: QR game with 4 games"
```

## 2) Push to GitHub

```powershell
cd "C:\Users\PC\Downloads\QR GAME"
git branch -M main
git remote add origin https://github.com/MarinVandelet/qr-game.git
git push -u origin main
```

If the remote already exists:

```powershell
git remote set-url origin https://github.com/MarinVandelet/qr-game.git
git push -u origin main
```

## 3) Connect to VPS

```bash
ssh ubuntu@54.37.158.194
```

If `ubuntu` does not work, try `debian` or `root` depending on your OVH image.

## 4) Remove currently deployed site and deploy new one

On VPS:

```bash
cd /tmp
curl -fsSL https://raw.githubusercontent.com/MarinVandelet/qr-game/main/deploy/vps-deploy.sh -o vps-deploy.sh
bash vps-deploy.sh
```

This script:
- installs `nginx`, `node`, `pm2`
- removes old `/var/www/qr-game`
- clones your GitHub repo
- builds frontend
- starts backend with PM2
- replaces nginx default site with QR GAME config

## 5) Environment variables to edit on VPS

### Backend: `/var/www/qr-game/backend/.env`

```env
PORT=4000
CORS_ORIGIN=http://54.37.158.194
```

If you add a domain later, use:

```env
CORS_ORIGIN=https://ton-domaine.com
```

### Frontend: `/var/www/qr-game/frontend/.env`

```env
VITE_API_URL=http://54.37.158.194
VITE_SOCKET_URL=http://54.37.158.194
```

Then rebuild and restart:

```bash
cd /var/www/qr-game/frontend
npm run build
pm2 restart qr-game-backend
sudo systemctl restart nginx
```

## 6) Verify

```bash
pm2 status
pm2 logs qr-game-backend --lines 100
sudo nginx -t
curl http://127.0.0.1:4000/
```

Then open:
- `http://54.37.158.194`

## 7) Optional domain + HTTPS (recommended)

Once DNS points to VPS:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ton-domaine.com -d www.ton-domaine.com
```