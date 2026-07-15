import redisClient from '../config/redis.config.js';
import logger from '../utils/logger.js';

const DEFAULT_TTL = process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL, 10) : 3600;

class CacheService {
  /**
   * Get value from cache
   * @param {string} key 
   * @returns {Promise<any>} Parsed JSON object or null if miss/error
   */
  async get(key) {
    try {
      const data = await redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null; // Graceful degradation
    }
  }

  /**
   * Set value in cache
   * @param {string} key 
   * @param {any} value 
   * @param {number} ttl Time to live in seconds
   */
  async set(key, value, ttl = DEFAULT_TTL) {
    try {
      const stringValue = JSON.stringify(value);
      await redisClient.set(key, stringValue, 'EX', ttl);
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete value from cache
   * @param {string} key 
   */
  async del(key) {
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error(`Cache del error for key ${key}:`, error);
    }
  }

  /**
   * Delete keys by pattern (e.g. invalidating a list)
   * @param {string} pattern 
   */
  async delByPattern(pattern) {
    try {
      let cursor = '0';
      do {
        const res = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = res[0];
        const keys = res[1];
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } while (cursor !== '0');
    } catch (error) {
      logger.error(`Cache delByPattern error for pattern ${pattern}:`, error);
    }
  }
}

export default new CacheService();
