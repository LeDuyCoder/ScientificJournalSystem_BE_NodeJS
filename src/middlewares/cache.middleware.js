import redis from '../config/redis.js';
import logger from '../utils/logger.js';

/**
 * Middleware cache response của các API GET bằng Redis.
 * - Cache key được tạo dựa trên `req.originalUrl` (bao gồm cả query string),
 *   đảm bảo mỗi tổ hợp filter/search/page khác nhau sẽ có cache riêng biệt.
 * - Nếu Redis đang lỗi/không kết nối được, middleware sẽ bỏ qua cache và
 *   để request đi thẳng xuống database (fail-open), tránh làm sập hệ thống.
 *
 * @param {number} ttlSeconds - Thời gian sống của cache (giây).
 * @param {string} [prefix='cache'] - Tiền tố cho cache key, dùng để nhóm/xóa cache theo nhóm.
 * @returns {import('express').RequestHandler}
 */
export const cacheMiddleware = (ttlSeconds, prefix = 'cache') => {
  return async (req, res, next) => {
    // Chỉ áp dụng cache cho GET request
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `${prefix}:${req.originalUrl}`;

    try {
      const cachedData = await redis.get(cacheKey);

      if (cachedData) {
        logger.info(`[CACHE HIT] ${cacheKey}`);
        return res.status(200).json(JSON.parse(cachedData));
      }

      logger.info(`[CACHE MISS] ${cacheKey}`);

      // Ghi đè res.json để tự động lưu lại response vào Redis trước khi trả về client
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redis.set(cacheKey, JSON.stringify(body), 'EX', ttlSeconds).catch((err) => {
            logger.error(`Lỗi khi lưu cache cho key ${cacheKey}:`, err);
          });
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      // Redis lỗi -> không chặn luồng chính, cứ để request chạy tiếp xuống DB
      logger.error('Lỗi khi thao tác với Redis cache:', error);
      next();
    }
  };
};

/**
 * Xóa toàn bộ cache key khớp với pattern cho trước.
 * Dùng để invalidate cache khi dữ liệu gốc thay đổi (create/update/delete).
 *
 * @param {string} pattern - Redis key pattern, ví dụ 'cache:/api/v1/journal*'.
 * @returns {Promise<void>}
 */
export const invalidateCacheByPattern = async (pattern) => {
  try {
    const stream = redis.scanStream({ match: pattern, count: 100 });
    const keysToDelete = [];

    for await (const keys of stream) {
      if (keys.length) {
        keysToDelete.push(...keys);
      }
    }

    if (keysToDelete.length > 0) {
      await redis.del(...keysToDelete);
      logger.info(`Đã xóa ${keysToDelete.length} cache key khớp pattern "${pattern}"`);
    }
  } catch (error) {
    logger.error(`Lỗi khi xóa cache theo pattern "${pattern}":`, error);
  }
};
