// File: backend/src/app.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const { sanitizeInput, sanitizeSensitive } = require("./middleware/sanitize");
const {
  requestLogger,
  errorLogger,
  performanceMonitor,
  analyticsTracker,
  healthCheck,
} = require("./middleware/logging");
const { getCacheStats, clearCache } = require("./middleware/cache");
const { getSecurityConfig } = require("../config/security-environments");
const securityMiddleware = require("./middleware/security");

const app = express();

app.set('trust proxy', true);

const helmetConfig = getSecurityConfig();

app.use(helmet(helmetConfig));

app.use(securityMiddleware.contentSecurityPolicy());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:19006",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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

app.use("/api/", securityMiddleware.apiAbuseDetection());

app.use("/api/", generalLimiter);

app.use("/api/auth/", authLimiter);

app.use("/api/upload/", uploadLimiter);

app.use(securityMiddleware.enhancedInputValidation());

app.use("/api/", securityMiddleware.sqlInjectionDetection());

app.use(
  express.json({
    limit: "5mb",
    verify: (req, res, buf) => {
      try {
        JSON.parse(buf);
      } catch (e) {
        res.status(400).json({
          success: false,
          message: "Invalid JSON format",
          code: "INVALID_JSON",
        });
        throw new Error("Invalid JSON");
      }
    },
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "5mb",
    parameterLimit: 100,
  })
);

app.use(compression());

if (process.env.NODE_ENV !== "test") {
  app.use(requestLogger);
  app.use(performanceMonitor);
  app.use(analyticsTracker.middleware);
  app.use(securityMiddleware.auditLogger());
}

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined"));
}

app.use(sanitizeInput);

app.use((req, res, next) => {
  res.removeHeader("X-Powered-By");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("X-Download-Options", "noopen");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  next();
});

app.get("/health", healthCheck);

if (process.env.NODE_ENV === "development") {
  app.get("/analytics", (req, res) => {
    res.json({
      success: true,
      message: "API Analytics",
      data: analyticsTracker.getStats(),
    });
  });

  app.get("/cache/stats", getCacheStats);
  app.delete("/cache", clearCache);
}

try {
  console.log("Loading auth routes...");
  const authRoutes = require("./routes/auth");
  app.use("/api/auth", sanitizeSensitive, authRoutes);

  console.log("Loading posts routes...");
  const postsRoutes = require("./routes/posts");
  app.use("/api/posts", postsRoutes);

  console.log("Loading alerts routes...");
  const alertsRoutes = require("./routes/alerts");
  app.use("/api/alerts", alertsRoutes);

  console.log("Loading weather routes...");
  const weatherRoutes = require("./routes/weather");
  app.use("/api/weather", weatherRoutes);

  console.log("Loading upload routes...");
  const uploadRoutes = require("./routes/upload");
  app.use("/api/upload", uploadRoutes);

  console.log("Loading notifications routes...");
  const notificationsRoutes = require("./routes/notifications");
  app.use("/api/notifications", notificationsRoutes);

  console.log("Loading search routes...");
  const searchRoutes = require("./routes/search");
  app.use("/api/search", searchRoutes);

  console.log("All routes loaded successfully");
} catch (routeError) {
  console.error("Error loading routes:", routeError);
  if (process.env.NODE_ENV !== "test") {
    throw new Error(`Failed to load routes: ${routeError.message}`);
  }
}

if (process.env.NODE_ENV !== "test") {
  app.use(errorLogger);
}

app.use((err, req, res, _next) => {
  if (err.message.includes("Invalid JSON") || 
      err.message.includes("too large") ||
      err.type === "entity.parse.failed") {
    securityMiddleware.logSecurityEvent(req, 'MALFORMED_REQUEST', {
      error: err.message,
      type: err.type,
    });
  }

  if (process.env.NODE_ENV !== "test") {
    console.error("Global error handler:", err);
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid request format",
      code: "INVALID_REQUEST",
    });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request too large",
      code: "REQUEST_TOO_LARGE",
    });
  }

  if (process.env.NODE_ENV === "production") {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  } else {
    res.status(500).json({
      success: false,
      message: err.message,
      stack: process.env.NODE_ENV === "test" ? undefined : err.stack,
      requestId: req.requestId,
      code: "INTERNAL_ERROR",
    });
  }
});

app.use((req, res) => {
  if (req.path.includes('/admin') || 
      req.path.includes('/wp-') ||
      req.path.includes('/.env') ||
      req.path.includes('/config')) {
    securityMiddleware.logSecurityEvent(req, 'SUSPICIOUS_404', {
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