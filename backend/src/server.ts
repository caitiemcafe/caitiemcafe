import { app } from './app.js';
import { env } from './config/env.js';
import { sequelize } from './config/database.js';

async function start() {
  try {
    await sequelize.authenticate();
    const server = app.listen(env.PORT, '127.0.0.1', () => console.log(`[api] http://127.0.0.1:${env.PORT}`));
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
