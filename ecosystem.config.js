module.exports = {
  apps: [
    {
      name: 'whatsapp-bot',
      script: 'app.js',
      instances: 1,
      autorestart: true,
      watch: true,
      max_memory_restart: '1G',
    },
  ],
};