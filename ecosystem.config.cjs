module.exports = {
  apps: [
    {
      name: 'enterra-site',
      script: 'node_modules/.bin/tsx',
      args: 'server/index.ts',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 50,
      min_uptime: '10s',
      exp_backoff_restart_delay: 2000,
      max_memory_restart: '512M',
      kill_timeout: 8000,
      listen_timeout: 10000,
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};
