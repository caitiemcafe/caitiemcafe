import { app } from './app.js';
import { env } from './config/env.js';
import { sequelize } from './config/database.js';

async function start() {
  try {
    await sequelize.authenticate();
    const host = process.env.HOST || '0.0.0.0';
    const server = app.listen(env.PORT, host, () => console.log(`[api] http://${host}:${env.PORT}`));
    const shutdown = (signal: string) => {
      console.log(`[api] ${signal}, đang dừng...`);
      server.close(() => void sequelize.close().finally(() => process.exit(0)));
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('[api] Không thể kết nối database.', error);
    process.exit(1);
  }
}

void start();
