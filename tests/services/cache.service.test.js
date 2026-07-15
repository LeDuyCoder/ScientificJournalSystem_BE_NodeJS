import cacheService from '../../src/src/services/cache.service.js';
import redisClient from '../../src/src/config/redis.config.js';

jest.mock('../../src/config/redis.config.js', () => ({
  status: 'ready',
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  scan: jest.fn()
}));

jest.mock('../../src/utils/logger.js', () => ({
  error: jest.fn(),
  info: jest.fn()
}));

describe('CacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return parsed JSON if data exists', async () => {
      redisClient.get.mockResolvedValueOnce('{"test":"data"}');
      const result = await cacheService.get('my-key');
      expect(result).toEqual({ test: 'data' });
      expect(redisClient.get).toHaveBeenCalledWith('my-key');
    });

    it('should return null if data does not exist', async () => {
      redisClient.get.mockResolvedValueOnce(null);
      const result = await cacheService.get('my-key');
      expect(result).toBeNull();
    });

    it('should return null and not throw if redis errors', async () => {
      redisClient.get.mockRejectedValueOnce(new Error('Redis Down'));
      const result = await cacheService.get('my-key');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set serialized data with TTL', async () => {
      redisClient.set.mockResolvedValueOnce('OK');
      await cacheService.set('my-key', { foo: 'bar' }, 100);
      expect(redisClient.set).toHaveBeenCalledWith('my-key', '{"foo":"bar"}', 'EX', 100);
    });

    it('should not throw if redis errors', async () => {
      redisClient.set.mockRejectedValueOnce(new Error('Redis Down'));
      await expect(cacheService.set('my-key', { foo: 'bar' })).resolves.not.toThrow();
    });
  });
});
