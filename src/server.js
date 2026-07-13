import { createApp } from './app.js';
import { connectDB } from './shared/config/db.js';
import { env } from './shared/config/env.js';
import { logger } from './shared/logger/logger.js';

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception — shutting down');
  process.exit(1);
});

async function main() {
  await connectDB();
  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, env: env.NODE_ENV },
      `API listening on http://localhost:${env.PORT}`,
    );
  });
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
