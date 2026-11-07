import mongoose from 'mongoose';
import { DATABASE_MAX_POOL_SIZE } from '../constants/api.js';
import { env } from './env.js';

export async function connectDatabase(): Promise<boolean> {
  if (!env.mongoUri) {
    console.warn('MONGODB_URI is not configured; data routes will return 503.');
    return false;
  }

  await mongoose.connect(env.mongoUri, {
    maxPoolSize: DATABASE_MAX_POOL_SIZE,
    serverSelectionTimeoutMS: 8000,
  });
  console.info('Connected to MongoDB.');
  return true;
}

export function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
