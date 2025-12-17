/**
 * CacheManager - Centralized cache for multi-client optimization
 *
 * Prevents redundant JSON serialization when multiple clients request same data.
 * Each cache entry has a TTL (Time To Live) to ensure data freshness.
 *
 * Usage:
 * ```js
 * const serialized = cacheManager.getOrSet('cpu_stats', 50, () => {
 *   const data = computeExpensiveData();
 *   return JSON.stringify(data);
 * });
 * client.send(serialized);
 * ```
 */
function CacheManager() {
  this.cache = Object.create(null);
  this.hits = 0;
  this.misses = 0;

  /**
   * Get cached data if still valid
   * @param {string} key - Cache key
   * @param {number} maxAgeMs - Max age in milliseconds
   * @returns {string|null} Cached serialized data or null if expired/missing
   */
  this.get = function(key, maxAgeMs) {
    const entry = this.cache[key];
    if (!entry) {
      this.misses++;
      return null;
    }

    const now = Date.now();
    if ((now - entry.ts) > maxAgeMs) {
      delete this.cache[key];
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.data;
  };

  /**
   * Store serialized data in cache
   * @param {string} key - Cache key
   * @param {string} data - Serialized JSON string
   */
  this.set = function(key, data) {
    this.cache[key] = { data, ts: Date.now() };
  };

  /**
   * Get cached data or compute and cache if missing/expired
   * @param {string} key - Cache key
   * @param {number} ttlMs - Time to live in milliseconds
   * @param {function(): string} computeStringFn - Function that returns serialized JSON
   * @returns {string} Cached or freshly computed serialized data
   */
  this.getOrSet = function(key, ttlMs, computeStringFn) {
    const cached = this.get(key, ttlMs);
    if (cached) return cached;

    const value = computeStringFn();
    this.set(key, value);
    return value;
  };

  /**
   * Get cache statistics for monitoring
   * @returns {object} Cache stats (size, hits, misses, keys)
   */
  this.stats = function() {
    return {
      size: Object.keys(this.cache).length,
      hits: this.hits,
      misses: this.misses,
      keys: Object.keys(this.cache),
    };
  };

  /**
   * Clear specific key or entire cache
   * @param {string} [key] - Optional key to clear, omit to clear all
   */
  this.clear = function(key) {
    if (key) {
      delete this.cache[key];
    } else {
      this.cache = Object.create(null);
    }
  };
}

// Singleton instance
export const cacheManager = new CacheManager();
