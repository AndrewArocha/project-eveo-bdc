import { app } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';

const server = app.listen(env.port, async () => {
  console.info(`EVEO API listening on port ${env.port}.`);
  try {
    await connectDatabase();
  } catch (error) {
    console.error('MongoDB connection failed; data routes will return 503.', error);
  }
});

async function shutdown(signal: string) {
  console.info(`${signal} received; shutting down EVEO API.`);
  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
