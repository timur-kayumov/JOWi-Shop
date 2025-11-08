import Redis, { RedisOptions } from 'ioredis';

export interface RedisCacheOptions {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  maxRetriesPerRequest?: number;
  connectTimeout?: number;
  commandTimeout?: number;
}

export class RedisClient {
  private client: Redis;
  private readonly keyPrefix: string;

  constructor(options: RedisCacheOptions = {}) {
    const {
      url,
      host = 'localhost',
      port = 6379,
      password,
      db = 0,
      keyPrefix = 'jowi:',
      maxRetriesPerRequest = 3,
      connectTimeout = 10000,
      commandTimeout = 5000,
    } = options;

    const redisOptions: RedisOptions = {
      maxRetriesPerRequest,
      connectTimeout,
      commandTimeout,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError: (err: Error) => {
        const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
        return targetErrors.some((targetError) =>
          err.message.includes(targetError)
        );
      },
    };

    if (url) {
      this.client = new Redis(url, redisOptions);
    } else {
      this.client = new Redis({
        ...redisOptions,
        host,
        port,
        password,
        db,
      });
    }

    this.keyPrefix = keyPrefix;

    // Event listeners for monitoring
    this.client.on('connect', () => {
      console.log('[RedisClient] Connected to Redis');
    });

    this.client.on('ready', () => {
      console.log('[RedisClient] Redis is ready');
    });

    this.client.on('error', (err) => {
      console.error('[RedisClient] Redis error:', err);
    });

    this.client.on('close', () => {
      console.warn('[RedisClient] Redis connection closed');
    });

    this.client.on('reconnecting', () => {
      console.log('[RedisClient] Reconnecting to Redis...');
    });
  }

  /**
   * Generate full cache key with prefix
   */
  private getFullKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(this.getFullKey(key));
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`[RedisClient] Error getting key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL (in seconds)
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      const fullKey = this.getFullKey(key);

      if (ttl && ttl > 0) {
        await this.client.setex(fullKey, ttl, serialized);
      } else {
        await this.client.set(fullKey, serialized);
      }

      return true;
    } catch (error) {
      console.error(`[RedisClient] Error setting key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete single key from cache
   */
  async del(key: string): Promise<boolean> {
    try {
      await this.client.del(this.getFullKey(key));
      return true;
    } catch (error) {
      console.error(`[RedisClient] Error deleting key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete keys matching a pattern
   * Example: deletePattern('product:*') deletes all keys starting with 'product:'
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const fullPattern = this.getFullKey(pattern);
      const keys = await this.client.keys(fullPattern);

      if (keys.length === 0) {
        return 0;
      }

      // Delete in batches of 100 to avoid blocking Redis
      const batchSize = 100;
      let deletedCount = 0;

      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        const deleted = await this.client.del(...batch);
        deletedCount += deleted;
      }

      return deletedCount;
    } catch (error) {
      console.error(
        `[RedisClient] Error deleting pattern ${pattern}:`,
        error
      );
      return 0;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(this.getFullKey(key));
      return result === 1;
    } catch (error) {
      console.error(`[RedisClient] Error checking existence of ${key}:`, error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key (in seconds)
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(this.getFullKey(key));
    } catch (error) {
      console.error(`[RedisClient] Error getting TTL for ${key}:`, error);
      return -2; // Key does not exist
    }
  }

  /**
   * Flush all keys in current database
   * WARNING: Use with caution!
   */
  async flushDb(): Promise<boolean> {
    try {
      await this.client.flushdb();
      return true;
    } catch (error) {
      console.error('[RedisClient] Error flushing database:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    totalKeys: number;
    memoryUsed: string;
    uptime: number;
  }> {
    try {
      const info = await this.client.info('stats');
      const dbSize = await this.client.dbsize();
      const memory = await this.client.info('memory');

      // Parse memory info
      const memoryMatch = memory.match(/used_memory_human:(\S+)/);
      const memoryUsed = memoryMatch ? memoryMatch[1] : 'N/A';

      // Parse uptime
      const uptimeMatch = info.match(/uptime_in_seconds:(\d+)/);
      const uptime = uptimeMatch ? parseInt(uptimeMatch[1], 10) : 0;

      return {
        connected: this.client.status === 'ready',
        totalKeys: dbSize,
        memoryUsed,
        uptime,
      };
    } catch (error) {
      console.error('[RedisClient] Error getting stats:', error);
      return {
        connected: false,
        totalKeys: 0,
        memoryUsed: 'N/A',
        uptime: 0,
      };
    }
  }

  /**
   * Check health of Redis connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('[RedisClient] Health check failed:', error);
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      console.log('[RedisClient] Disconnected from Redis');
    } catch (error) {
      console.error('[RedisClient] Error disconnecting:', error);
      // Force close if graceful quit fails
      this.client.disconnect();
    }
  }

  /**
   * Get underlying Redis client for advanced operations
   */
  getClient(): Redis {
    return this.client;
  }
}
