import Redis from 'ioredis';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';
dotenv.config();

const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redisClient.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis');
});

// Connect explicitly if needed or let it connect on first command
// redisClient.connect().catch(console.error);

export default redisClient;
