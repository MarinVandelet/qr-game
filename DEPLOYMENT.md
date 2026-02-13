# Deployment (Ubuntu VPS)

## 1) Backend

```bash
cd backend
npm ci
cp .env.example .env
# edit .env values
npm run start
```

Environment variables:
- `PORT` (default `4000`)
- `CORS_ORIGIN` (example: `https://your-domain.com`)

## 2) Frontend

```bash
cd frontend
npm ci
cp .env.example .env
# edit .env values
npm run build
```

Environment variables:
- `VITE_API_URL` (example: `https://your-domain.com`)
- `VITE_SOCKET_URL` (example: `https://your-domain.com`)

Build output is generated in `frontend/dist`.

## 3) Nginx reverse proxy (recommended)

- Serve `frontend/dist` as static site.
- Proxy `/api` and Socket.IO traffic to Node backend (`127.0.0.1:4000`).

## 4) Process manager

Use `pm2` or `systemd` for backend process persistence and restart.