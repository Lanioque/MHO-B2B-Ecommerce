import { Redis } from "@upstash/redis";

let redisInstance: Redis | null = null;

export const getRedis = () => {
  if (!redisInstance && process.env.REDIS_URL && process.env.REDIS_REST_TOKEN) {
    redisInstance = new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_REST_TOKEN,
    });
    return redisInstance;
  }

  // Return a mock implementation for local dev
  return {
    get: async () => null,
    set: async () => "OK",
    del: async () => 1,
    exists: async () => 0,
    ping: async () => "PONG",
  };
};

export const redis = getRedis();

