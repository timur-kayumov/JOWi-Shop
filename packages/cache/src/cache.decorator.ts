import { CacheableOptions, CacheEvictOptions } from './index';

/**
 * Symbol to store cache service instance
 */
const CACHE_SERVICE_SYMBOL = Symbol('CACHE_SERVICE');

/**
 * Decorator to cache method results
 *
 * @example
 * ```typescript
 * @Cacheable({
 *   keyPrefix: 'product',
 *   ttl: 3600, // 1 hour
 *   keyGenerator: (tenantId: string, id: string) => `${tenantId}:${id}`
 * })
 * async findById(tenantId: string, id: string) {
 *   return await this.prisma.product.findFirst({ where: { tenantId, id } });
 * }
 * ```
 */
export function Cacheable(options: CacheableOptions): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Get cache service from instance (will be injected by NestJS)
      const cacheService = (this as any)[CACHE_SERVICE_SYMBOL];

      if (!cacheService) {
        console.warn(
          `[Cacheable] Cache service not found on ${target.constructor.name}.${String(propertyKey)}. Executing without cache.`,
        );
        return originalMethod.apply(this, args);
      }

      try {
        // Generate cache key
        const cacheKey = options.keyGenerator
          ? `${options.keyPrefix}:${options.keyGenerator(...args)}`
          : `${options.keyPrefix}:${JSON.stringify(args)}`;

        // Try to get from cache
        const cachedValue = await cacheService.get(cacheKey);

        if (cachedValue !== null) {
          console.log(
            `[Cacheable] Cache HIT for ${target.constructor.name}.${String(propertyKey)} (key: ${cacheKey})`,
          );
          return cachedValue;
        }

        console.log(
          `[Cacheable] Cache MISS for ${target.constructor.name}.${String(propertyKey)} (key: ${cacheKey})`,
        );

        // Execute original method
        const result = await originalMethod.apply(this, args);

        // Store in cache
        if (result !== null && result !== undefined) {
          await cacheService.set(cacheKey, result, options.ttl);
        }

        return result;
      } catch (error) {
        console.error(
          `[Cacheable] Error in ${target.constructor.name}.${String(propertyKey)}:`,
          error,
        );
        // On cache error, fallback to original method
        return originalMethod.apply(this, args);
      }
    };

    return descriptor;
  };
}

/**
 * Decorator to evict cache entries matching a pattern
 *
 * @example
 * ```typescript
 * @CacheEvict({ pattern: 'product:*' })
 * async update(tenantId: string, id: string, data: any) {
 *   return await this.prisma.product.update({ where: { id }, data });
 * }
 * ```
 */
export function CacheEvict(options: CacheEvictOptions | string): MethodDecorator {
  const evictOptions: CacheEvictOptions =
    typeof options === 'string' ? { pattern: options } : options;

  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Get cache service from instance
      const cacheService = (this as any)[CACHE_SERVICE_SYMBOL];

      try {
        // Execute original method first
        const result = await originalMethod.apply(this, args);

        // Then evict cache
        if (cacheService) {
          const deletedCount = await cacheService.deletePattern(
            evictOptions.pattern,
          );
          console.log(
            `[CacheEvict] Evicted ${deletedCount} keys matching pattern '${evictOptions.pattern}' after ${target.constructor.name}.${String(propertyKey)}`,
          );
        } else {
          console.warn(
            `[CacheEvict] Cache service not found on ${target.constructor.name}.${String(propertyKey)}. Skipping cache eviction.`,
          );
        }

        return result;
      } catch (error) {
        console.error(
          `[CacheEvict] Error in ${target.constructor.name}.${String(propertyKey)}:`,
          error,
        );
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Helper function to inject cache service into class instance
 * This should be called in the class constructor
 *
 * @example
 * ```typescript
 * constructor(
 *   private prisma: PrismaService,
 *   private cacheService: CacheService,
 * ) {
 *   injectCacheService(this, cacheService);
 * }
 * ```
 */
export function injectCacheService(instance: any, cacheService: any): void {
  instance[CACHE_SERVICE_SYMBOL] = cacheService;
}
