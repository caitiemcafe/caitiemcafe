module.exports = {
  apps: [{
    name: 'cai-tiem-cafe-api',
    cwd: '/var/www/cai-tiem-cafe/backend',
    script: 'dist/server.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    max_memory_restart: '350M',
    env: { NODE_ENV: 'production', PORT: 3003 },
    error_file: '/var/log/pm2/cai-tiem-cafe-error.log',
    out_file: '/var/log/pm2/cai-tiem-cafe-out.log',
    merge_logs: true,
    time: true,
  }],
};
