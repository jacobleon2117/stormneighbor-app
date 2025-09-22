const crypto = require("crypto");
const logger = require("../utils/logger");
const { checkDatabaseHealth, getDatabaseStats } = require("./database");

const generateRequestId = (bytes = 16) => crypto.randomBytes(bytes).toString("hex");

const isDebug = () => process.env.LOG_LEVEL === "debug";

const sanitizeLogData = (data) => {
  if (!data || typeof data !== "object") return data;

  const sensitiveFields = [
    "password",
    "currentPassword",
    "newPassword",
    "passwordHash",
    "token",
    "accessToken",
    "refreshToken",
    "apiKey",
    "secret",
    "authorization",
    "cookie",
    "session",
  ];

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key in sanitized) {
    if (sensitiveFields.includes(key)) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  }

  return sanitized;
};

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  req.requestId = requestId;

  if (isDebug()) {
    logger.info(`[${new Date().toISOString()}] [${requestId}] ${req.method} ${req.path}`, {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get("User-Agent"),
      contentLength: req.get("Content-Length") || 0,
      query: Object.keys(req.query).length ? req.query : undefined,
      body: req.method !== "GET" && req.body ? sanitizeLogData(req.body) : undefined,
    });
  }

  const originalJson = res.json.bind(res);
  res.json = (data) => {
    const duration = Date.now() - startTime;

    if (isDebug() || res.statusCode >= 400) {
      logger.info(
        `[${new Date().toISOString()}] [${requestId}] Response ${res.statusCode} - ${duration}ms`,
        {
          status: res.statusCode,
          duration: `${duration}ms`,
          contentLength: JSON.stringify(data).length,
          responseData: res.statusCode >= 400 ? sanitizeLogData(data) : undefined,
        }
      );
    }

    return originalJson(data);
  };

  next();
};

const errorLogger = (err, req, _res, next) => {
  const requestId = req.requestId || "unknown";
  logger.error(`[${new Date().toISOString()}] [${requestId}] ERROR:`, {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get("User-Agent"),
    body: req.body ? sanitizeLogData(req.body) : undefined,
  });
  next(err);
};

const performanceMonitor = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  const initialMemory = process.memoryUsage();

  res.once("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startTime) / 1e6;
    const finalMemory = process.memoryUsage();

    if (durationMs > 1000) {
      logger.warn(`[${new Date().toISOString()}] [${req.requestId}] SLOW REQUEST`, {
        method: req.method,
        path: req.path,
        duration: `${durationMs.toFixed(2)}ms`,
        memoryDelta: {
          heapUsed: `${((finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024).toFixed(2)}MB`,
          rss: `${((finalMemory.rss - initialMemory.rss) / 1024 / 1024).toFixed(2)}MB`,
        },
      });
    }

    const heapIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
    if (heapIncrease > 50) {
      logger.warn(`[${new Date().toISOString()}] [${req.requestId}] HIGH MEMORY USAGE`, {
        method: req.method,
        path: req.path,
        heapIncrease: `${heapIncrease.toFixed(2)}MB`,
        currentHeap: `${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      });
    }
  });

  next();
};

const analyticsTracker = (() => {
  const stats = {
    totalRequests: 0,
    endpoints: {},
    methods: {},
    statusCodes: {},
    errors: 0,
    startTime: Date.now(),
  };

  return {
    middleware: (req, res, next) => {
      stats.totalRequests++;
      const endpoint = req.route?.path || req.originalUrl || req.path;
      stats.endpoints[endpoint] = (stats.endpoints[endpoint] || 0) + 1;
      stats.methods[req.method] = (stats.methods[req.method] || 0) + 1;

      res.once("finish", () => {
        const statusCode = res.statusCode;
        stats.statusCodes[statusCode] = (stats.statusCodes[statusCode] || 0) + 1;
        if (statusCode >= 400) stats.errors++;
      });

      next();
    },
    getStats: () => {
      const uptime = Date.now() - stats.startTime;
      return {
        ...stats,
        uptime: `${Math.floor(uptime / 1000 / 60)} minutes`,
        errorRate:
          stats.totalRequests > 0
            ? ((stats.errors / stats.totalRequests) * 100).toFixed(2) + "%"
            : "0%",
        requestsPerMinute:
          stats.totalRequests > 0 ? (stats.totalRequests / (uptime / 1000 / 60)).toFixed(2) : "0",
      };
    },
  };
})();

const healthCheck = async (_req, res) => {
  const memory = process.memoryUsage();
  const uptime = process.uptime();

  try {
    const dbHealth = await checkDatabaseHealth();
    const dbStats = getDatabaseStats();

    res.json({
      status: dbHealth.status === "healthy" ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime / 60)} minutes`,
      memory: {
        heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        heapTotal: `${(memory.heapTotal / 1024 / 1024).toFixed(2)}MB`,
        rss: `${(memory.rss / 1024 / 1024).toFixed(2)}MB`,
        external: `${(memory.external / 1024 / 1024).toFixed(2)}MB`,
      },
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      database: dbHealth,
      analytics: analyticsTracker.getStats(),
      performance: {
        database: {
          totalQueries: dbStats.totalQueries,
          averageQueryTime: dbStats.averageQueryTime,
          errorRate: dbStats.errorRate,
          slowQueryRate: dbStats.slowQueryRate,
          queriesPerMinute: dbStats.queriesPerMinute,
        },
      },
    });
  } catch (error) {
    logger.error("Health check error:", error);
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Health check failed",
      message: error.message,
    });
  }
};

module.exports = {
  requestLogger,
  errorLogger,
  performanceMonitor,
  analyticsTracker,
  healthCheck,
  generateRequestId,
};
