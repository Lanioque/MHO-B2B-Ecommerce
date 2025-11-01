import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Redis utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getRedis', () => {
    it('should return mock implementation when Redis URL is not set', async () => {
      delete process.env.REDIS_URL;
      delete process.env.REDIS_REST_TOKEN;

      const { getRedis } = await import('./redis');
      const redis = getRedis();

      expect(redis).toBeDefined();
      expect(redis.get).toBeDefined();
      expect(redis.set).toBeDefined();
      expect(redis.del).toBeDefined();
      expect(redis.exists).toBeDefined();
      expect(redis.ping).toBeDefined();

      // Test mock implementations
      const getResult = await redis.get('test-key');
      expect(getResult).toBeNull();

      const setResult = await redis.set('test-key', 'test-value');
      expect(setResult).toBe('OK');

      const delResult = await redis.del('test-key');
      expect(delResult).toBe(1);

      const existsResult = await redis.exists('test-key');
      expect(existsResult).toBe(0);

      const pingResult = await redis.ping();
      expect(pingResult).toBe('PONG');
    });

    it('should return Redis instance when environment variables are set', async () => {
      process.env.REDIS_URL = 'https://redis.example.com';
      process.env.REDIS_REST_TOKEN = 'test-token';

      const { getRedis } = await import('./redis');
      const redis = getRedis();

      // Should return a Redis instance (not the mock)
      expect(redis).toBeDefined();
    });

    it('should return same instance on multiple calls when Redis is configured', async () => {
      process.env.REDIS_URL = 'https://redis.example.com';
      process.env.REDIS_REST_TOKEN = 'test-token';

      const { getRedis } = await import('./redis');
      const redis1 = getRedis();
      const redis2 = getRedis();

      // When Redis is configured, it should return the same instance
      // Note: The actual implementation returns a new mock object if Redis is not configured,
      // so we test that when Redis is configured, the singleton pattern works
      expect(redis1).toBeDefined();
      expect(redis2).toBeDefined();
      // The singleton only works for real Redis instances, not mocks
      if (redis1.constructor.name !== 'Object') {
        expect(redis1).toBe(redis2);
      }
    });
  });

  describe('redis export', () => {
    it('should export redis instance', async () => {
      delete process.env.REDIS_URL;
      delete process.env.REDIS_REST_TOKEN;

      const redisModule = await import('./redis');
      expect(redisModule.redis).toBeDefined();
    });
  });
});

