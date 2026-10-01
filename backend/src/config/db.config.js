import mongoose from 'mongoose';
import { env } from './env.config.js';
import { logger } from './logger.config.js';

let isConnected = false;

export const connectDatabase = async () => {
  if (isConnected) {
    logger.info('Using existing MongoDB connection');
    return;
  }

  const options = {
    minPoolSize: env.MONGODB_MIN_POOL_SIZE,
    maxPoolSize: env.MONGODB_MAX_POOL_SIZE,
    serverSelectionTimeoutMS: env.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
    autoIndex: env.NODE_ENV !== 'production',
  };

  try {
    logger.info(
      `Connecting to MongoDB at ${env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}...`
    );

    mongoose.connection.on('connected', () => {
      isConnected = true;
      logger.info('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error({ err }, 'MongoDB connection encountered an error');
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('MongoDB connection lost. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      isConnected = true;
      logger.info('MongoDB reconnected successfully');
    });

    await mongoose.connect(env.MONGODB_URI, options);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to initialize MongoDB connection at boot');
    // In production we may choose to exit, but in dev we keep the server responsive so health endpoints work
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

export const disconnectDatabase = async () => {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected through app termination');
  }
};

export const getDbStatus = () => {
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const stateCode = mongoose.connection.readyState;
  return {
    state: states[stateCode] || 'unknown',
    statusCode: stateCode,
    isConnected: stateCode === 1,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
  };
};
