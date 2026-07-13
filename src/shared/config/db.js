import mongoose from 'mongoose';
import { env } from './env.js';
import { loggerFor } from '../logger/logger.js';

const log = loggerFor('db');

export async function connectDB() {
  mongoose.connection.on('error', (err) => {
    log.error({ err }, 'MongoDB connection error');
  });
  mongoose.connection.on('disconnected', () => {
    log.warn('MongoDB disconnected');
  });

  await mongoose.connect(env.MONGODB_URI);
  log.info({ host: mongoose.connection.host }, 'MongoDB connected');
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
