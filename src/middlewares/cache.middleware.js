import cacheService from '../services/cache.service.js';
import crypto from 'crypto';

/**
 * Middleware to cache GET requests
 * Note: Only for generic endpoints. For endpoints needing custom key generation (like analytics), use cacheService directly in the controller.
 * @param {string} entityPrefix e.g. 'articles', 'projects'
 * @param {number} ttl optional custom TTL
 */
export const cacheMiddleware = (entityPrefix, ttl) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Do not cache authenticated requests if that's a strict requirement, 
    // or include user ID in hash. For read-only public APIs, we just hash query/params.
    const pathAndQuery = req.originalUrl || req.url;
    const hash = crypto.createHash('md5').update(pathAndQuery).digest('hex');
    
    // Pattern: entity:list:hash
    // We use a simplified key here. For detailed entities we use cacheService in controller.
    const key = `${entityPrefix}:list:${hash}`;

    try {
      const cachedData = await cacheService.get(key);
      if (cachedData) {
        return res.status(200).json(cachedData);
      }

      // Override res.json to capture response
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(key, body, ttl);
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      next(); // Continue if cache fails (graceful degradation)
    }
  };
};
