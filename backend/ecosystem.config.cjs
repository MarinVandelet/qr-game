module.exports = {
  apps: [
    {
      name: "qr-game-backend",
      cwd: "/var/www/qr-game/backend",
      script: "index.js",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
    },
  ],
};