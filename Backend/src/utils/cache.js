/**
 * Lightweight in-memory cache for frequently accessed data
 * Simple TTL-based cache to reduce database load
 * Cache Strategy:
 * - Normal requests: Use cache with 2-minute TTL for optimal performance
 * - Force refresh (refresh=true): Skip cache, fetch fresh from database, then cache the result
 * - Cache is automatically cleared when data is modified (create/update/delete)
 */

const cache = new Map();
// Optimized TTL: 2 minutes (120,000ms) for better data freshness in risk management
// Balance between performance (reduced DB load) and data accuracy (fresh data)
// When user performs manual refresh, cache is bypassed and fresh data is fetched from database
const DEFAULT_TTL = 2 * 60 * 1000; // 2 minutes default TTL (120,000ms)

/**
 * Get cached value
 */
export function getCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  
  // Check if expired
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return item.value;
}

/**
 * Set cached value with TTL
 */
export function setCache(key, value, ttlMs = DEFAULT_TTL) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Delete cached value
 */
export function deleteCache(key) {
  cache.delete(key);
}

/**
 * Clear all cache
 */
export function clearCache() {
  cache.clear();
}

/**
 * Clear cache by pattern (prefix)
 */
export function clearCacheByPattern(pattern) {
  for (const key of cache.keys()) {
    if (key.startsWith(pattern)) {
      cache.delete(key);
    }
  }
}

/**
 * Cleanup expired entries (run periodically)
 */
export function cleanupExpiredCache() {
  const now = Date.now();
  for (const [key, item] of cache.entries()) {
    if (now > item.expiresAt) {
      cache.delete(key);
    }
  }
}

// Run cleanup every 5 minutes (more frequent for better memory management)
setInterval(cleanupExpiredCache, 5 * 60 * 1000);

/**
 * Cache statistics
 */
export function getCacheStats() {
  const now = Date.now();
  let expired = 0;
  let active = 0;
  
  for (const item of cache.values()) {
    if (now > item.expiresAt) {
      expired++;
    } else {
      active++;
    }
  }
  
  return {
    total: cache.size,
    active,
    expired,
  };
}
