const crypto = require("crypto");
const logger = require("../utils/logger");

class InMemoryCache {
  constructor({ maxSize = 1000, cleanupIntervalMs = 5 * 60 * 1000 } = {}) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      startTime: Date.now(),
    };

    if (process.env.NODE_ENV !== "test") {
      this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
    }
  }

  clearCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  generateKey(req) {
    const keyData = {
      path: req.route?.path || req.path,
      method: req.method,
      query: req.query,
      userId: req.user?.userId || null,
      accept: req.get("Accept"),
      userAgent: req.get("User-Agent")?.substring(0, 50),
    };
    return crypto.createHash("md5").update(JSON.stringify(keyData)).digest("hex");
  }

  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      return null;
    }

    this.stats.hits++;
    entry.lastAccessed = Date.now();
    return entry.data;
  }

  set(key, data, ttlMs = 300000) {
    const entry = {
      data,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      expiresAt: Date.now() + ttlMs,
      ttl: ttlMs,
      size: Buffer.byteLength(JSON.stringify(data)),
    };

    this.cache.set(key, entry);
    this.stats.sets++;

    if (this.cache.size > this.maxSize) {
      this.evictOldest();
    }
  }

  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) this.stats.deletes++;
    return deleted;
  }

  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.deletes += size;
  }

  cleanup() {
    const now = Date.now();
    let evicted = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        evicted++;
      }
    }

    this.stats.evictions += evicted;

    if (evicted > 0) {
      logger.info(
        `[${new Date().toISOString()}] Cache cleanup: ${evicted} expired entries removed`
      );
    }
  }

  evictOldest() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      logger.info(`[${new Date().toISOString()}] Evicted oldest cache entry: ${oldestKey}`);
    }
  }

  getStats() {
    const uptime = Date.now() - this.stats.startTime;
    const totalRequests = this.stats.hits + this.stats.misses;

    return {
      ...this.stats,
      size: this.cache.size,
      hitRate:
        totalRequests > 0 ? ((this.stats.hits / totalRequests) * 100).toFixed(2) + "%" : "0%",
      uptime: `${Math.floor(uptime / 1000 / 60)} minutes`,
      memoryUsage: `${(Array.from(this.cache.values()).reduce((acc, e) => acc + e.size, 0) / 1024 / 1024).toFixed(2)}MB`,
    };
  }
}

const cache = new InMemoryCache({ maxSize: 1000 });

const createCacheMiddleware =
  ({
    ttl = 300000,
    skipCache = false,
    skipOnError = true,
    onlyForGET = true,
    keyGenerator = null,
  } = {}) =>
  (req, res, next) => {
    if (skipCache || (onlyForGET && req.method !== "GET")) return next();

    const cacheKey = keyGenerator ? keyGenerator(req) : cache.generateKey(req);
    const requestId = req.requestId || "unknown";

    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      logger.info(
        `[${new Date().toISOString()}] [${requestId}] Cache HIT: ${req.method} ${req.path}`
      );
      res.set({
        "X-Cache": "HIT",
        "X-Cache-Key": cacheKey.substring(0, 8),
        "Cache-Control": `public, max-age=${ttl / 1000}`,
      });
      return res.json(cachedData);
    }

    logger.info(
      `[${new Date().toISOString()}] [${requestId}] Cache MISS: ${req.method} ${req.path}`
    );

    const originalJson = res.json;
    res.json = function (data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          cache.set(cacheKey, data, ttl);
          res.set({
            "X-Cache": "MISS",
            "X-Cache-Key": cacheKey.substring(0, 8),
            "Cache-Control": `public, max-age=${ttl / 1000}`,
          });
        } catch (err) {
          if (!skipOnError) logger.error(`[${requestId}] Cache set error: ${err.stack}`);
        }
      }
      return originalJson.call(this, data);
    };

    next();
  };

const invalidateCache =
  (patterns = []) =>
  (req, res, next) => {
    const originalJson = res.json;

    res.json = function (data) {
      if (
        res.statusCode >= 200 &&
        res.statusCode < 300 &&
        ["POST", "PUT", "DELETE"].includes(req.method)
      ) {
        const requestId = req.requestId || "unknown";
        let invalidated = 0;

        if (patterns.length === 0) {
          invalidated = cache.cache.size;
          cache.clear();
        } else {
          for (const [key, entry] of cache.cache.entries()) {
            const shouldInvalidate = patterns.some((pattern) => {
              if (typeof pattern === "string")
                return entry.data && JSON.stringify(entry.data).includes(pattern);
              if (pattern instanceof RegExp) return pattern.test(key);
              return false;
            });

            if (shouldInvalidate) {
              cache.delete(key);
              invalidated++;
            }
          }
        }

        if (invalidated > 0)
          logger.info(
            `[${new Date().toISOString()}] [${requestId}] Cache invalidated: ${invalidated} entries`
          );
      }

      return originalJson.call(this, data);
    };

    next();
  };

const getCacheStats = (_req, res) =>
  res.json({ success: true, message: "Cache statistics", data: cache.getStats() });
const clearCache = (_req, res) => {
  const sizeBefore = cache.cache.size;
  cache.clear();
  res.json({
    success: true,
    message: "Cache cleared successfully",
    data: { entriesRemoved: sizeBefore, cacheSize: cache.cache.size },
  });
};

const cacheConfigs = {
  shortTerm: createCacheMiddleware({ ttl: 60000 }),
  medium: createCacheMiddleware({ ttl: 300000 }),
  longTerm: createCacheMiddleware({ ttl: 900000 }),
  static: createCacheMiddleware({ ttl: 3600000 }),
  none: (req, res, next) => next(),
};

module.exports = {
  cache,
  createCacheMiddleware,
  invalidateCache,
  getCacheStats,
  clearCache,
  cacheConfigs,
};
