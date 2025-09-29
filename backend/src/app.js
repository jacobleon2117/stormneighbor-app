console.log("app.js loaded");

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const logger = require("./utils/logger");
const EnvironmentValidator = require("./utils/envValidator");
const securityMiddleware = require("./middleware/security");
const { sanitizeSensitive } = require("./middleware/sanitize");
const {
  requestLogger,
  errorLogger,
  performanceMonitor,
  analyticsTracker,
  healthCheck,
} = require("./middleware/logging");
const { createCacheMiddleware, getCacheStats, clearCache } = require("./middleware/cache");
const { databaseMiddleware } = require("./middleware/database");
const { globalErrorHandler } = require("./middleware/errorHandler");
const { getSecurityConfig } = require("../config/security-environments");
const sslConfig = require("./config/sslConfig");
const sslSecurity = require("./middleware/sslSecurity");

if (process.env.NODE_ENV !== "test") {
  const validator = new EnvironmentValidator();
  const result = validator.validate();

  if (!result.isValid) {
    logger.error("Environment validation failed. Application cannot start.");
    process.exitCode = 1;
  }

  if (result.warnings.length > 0 && process.env.NODE_ENV === "production") {
    logger.warn("Production environment has configuration warnings. Please review.");
  }
}

const app = express();
console.log("app instance:", !!app);

app.set("trust proxy", sslConfig.getSSLConfig().trustedProxies);

sslSecurity.initialize(app);
app.use(helmet(getSecurityConfig()));
app.use(cors(sslConfig.getCORSConfig()));

const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
    code: "AUTH_RATE_LIMIT",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many upload requests, please try again later.",
    code: "UPLOAD_RATE_LIMIT",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);
app.use("/api/v1/auth", authLimiter);
app.use("/api/v1/upload", uploadLimiter);

app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
  morgan("combined", {
    skip: (req) => req.url.includes("/health") || req.url.includes("/cache/stats"),
  })
);

app.use(securityMiddleware.sanitizeInput());
app.use(securityMiddleware.securityHeaders());
app.use(securityMiddleware.loginBruteForceProtection());
// Note: requireAuthToken should not be applied globally - it's applied per route via the auth middleware
app.use(requestLogger);
app.use(performanceMonitor);
app.use(analyticsTracker.middleware);

app.use(databaseMiddleware);

app.get("/", (_req, res) =>
  res.json({
    success: true,
    message: "StormNeighbor API Server is running",
    version: "1.0.0",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
);

app.get("/health", healthCheck);

app.get("/analytics", (_req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({
      success: false,
      message: "Route not found",
      code: "NOT_FOUND",
    });
  }

  res.json({
    success: true,
    message: "API Analytics",
    data: {
      analytics: analyticsTracker.getStats(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    },
  });
});

app.get("/api/v1/cache/stats", getCacheStats);
app.post("/api/v1/cache/clear", clearCache);

try {
  const weatherCache = createCacheMiddleware({ ttl: 300000 });

  const routePairs = [
    ["auth", "./routes/auth", sanitizeSensitive],
    ["users", "./routes/users"],
    ["posts", "./routes/posts"],
    ["comments", "./routes/comments"],
    ["upload", "./routes/upload"],
    ["weather", "./routes/weather", weatherCache],
    ["neighborhoods", "./routes/neighborhoods"],
    ["alerts", "./routes/alerts"],
    ["search", "./routes/search"],
    ["notifications", "./routes/notifications"],
    ["messages", "./routes/messages"],
    ["feedback", "./routes/feedback"],
    ["admin/backups", "./routes/backup"],
    ["admin", "./routes/admin"],
  ];

  for (const [path, routePath, middleware] of routePairs) {
    try {
      const route = require(routePath);
      if (middleware) {
        app.use(`/api/v1/${path}`, middleware, route);
      } else {
        app.use(`/api/v1/${path}`, route);
      }
      logger.info(`Loaded route: /api/v1/${path}`);
    } catch (err) {
      logger.error(`Failed to load route /api/v1/${path}: ${err.message}`);
    }
  }
} catch (routeError) {
  logger.error("Error loading routes:", routeError.message);
  if (process.env.NODE_ENV !== "test") {
    throw new Error(`Failed to load routes: ${routeError.message}`);
  }
}

if (process.env.NODE_ENV !== "test") {
  app.use(errorLogger);
}
app.use(globalErrorHandler);

app.use((req, res) => {
  if (req.path.match(/\/admin|\/wp-|\/\.env|\/config/)) {
    securityMiddleware.logSecurityEvent(req, "SUSPICIOUS_404", {
      path: req.path,
      query: req.query,
    });
  }

  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
    method: req.method,
    code: "NOT_FOUND",
  });
});

module.exports = app;
