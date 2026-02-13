# One-shot Ubuntu VPS deploy commands
# Run as root or with sudo where needed.

set -e

# 1) Dependencies
sudo apt update
sudo apt install -y git nginx curl

# 2) Node 20 + pm2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# 3) Project checkout
sudo mkdir -p /var/www
cd /var/www
if [ -d qr-game ]; then
  sudo rm -rf qr-game
fi
sudo git clone https://github.com/MarinVandelet/qr-game.git
sudo chown -R $USER:$USER qr-game
cd qr-game

# 4) Backend
cd backend
cp .env.example .env
# Edit .env before continuing
# nano .env
npm ci
pm2 start ecosystem.config.cjs
pm2 save
cd ..

# 5) Frontend
cd frontend
cp .env.example .env
# Edit .env before continuing
# nano .env
npm ci
npm run build
cd ..

# 6) Nginx
sudo cp deploy/nginx-qr-game.conf /etc/nginx/sites-available/qr-game
if [ -L /etc/nginx/sites-enabled/default ]; then
  sudo rm /etc/nginx/sites-enabled/default
fi
sudo ln -sf /etc/nginx/sites-available/qr-game /etc/nginx/sites-enabled/qr-game
sudo nginx -t
sudo systemctl restart nginx

# 7) PM2 startup on reboot
pm2 startup systemd -u $USER --hp $HOME
pm2 save