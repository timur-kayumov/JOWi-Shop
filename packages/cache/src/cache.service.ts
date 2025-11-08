import { RedisClient, RedisCacheOptions } from './redis.client';

export class CacheService {
  private redisClient: RedisClient;

  constructor(options?: RedisCacheOptions) {
    this.redisClient = new RedisClient(options);
  }

  /**
   * Get value from cache with automatic JSON parsing
   */
  async get<T = any>(key: string): Promise<T | null> {
    return this.redisClient.get<T>(key);
  }

  /**
   * Set value in cache with optional TTL
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    return this.redisClient.set(key, value, ttl);
  }

  /**
   * Delete a single key
   */
  async del(key: string): Promise<boolean> {
    return this.redisClient.del(key);
  }

  /**
   * Delete all keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    return this.redisClient.deletePattern(pattern);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    return this.redisClient.exists(key);
  }

  /**
   * Get TTL for a key
   */
  async ttl(key: string): Promise<number> {
    return this.redisClient.ttl(key);
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    return this.redisClient.getStats();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    return this.redisClient.healthCheck();
  }

  /**
   * Cleanup - disconnect from Redis
   */
  async disconnect() {
    await this.redisClient.disconnect();
  }

  /**
   * Get underlying Redis client
   */
  getClient() {
    return this.redisClient.getClient();
  }
}
