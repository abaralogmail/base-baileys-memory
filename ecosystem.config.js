module.exports = {
  apps: [
    {
      name: 'whatsapp-bot',
      script: 'app.js',
      instances: 1,
      autorestart: true,
      watch: true,
      max_memory_restart: '1G',
      cron_restart: '0 16 * * 1-5,0 9 * * 6',
      cron_stop: '0 20 * * 1-5,0 12 * * 6'
    },
  ],
};
