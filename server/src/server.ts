import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const PORT = env.PORT || 5000;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  logger.info(`SilverSync backend running at http://${HOST}:${PORT} [${env.NODE_ENV}]`);
});

// Graceful shutdown handling
function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Gracefully shutting down...`);
  server.close(() => {
    logger.info('HTTP server closed. Exiting process.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;
