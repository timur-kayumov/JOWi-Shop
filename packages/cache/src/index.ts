// Export RedisClient and its types
export { RedisClient, type RedisCacheOptions } from './redis.client';

// Export CacheService
export { CacheService } from './cache.service';

// Export cache decorators
export { Cacheable, CacheEvict, injectCacheService } from './cache.decorator';

// Type exports for cache operations
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string; // Prefix for cache keys
  keyGenerator?: (...args: any[]) => string; // Custom key generator function
}

export interface CacheableOptions extends CacheOptions {
  /**
   * Prefix for cache keys
   * Example: 'product' will generate keys like 'product:123'
   */
  keyPrefix: string;

  /**
   * Time to live in seconds
   */
  ttl: number;

  /**
   * Custom key generator function
   * If not provided, will use JSON.stringify of arguments
   */
  keyGenerator?: (...args: any[]) => string;
}

export interface CacheEvictOptions {
  /**
   * Pattern to match keys for eviction
   * Example: 'product:*' will delete all keys starting with 'product:'
   */
  pattern: string;
}
