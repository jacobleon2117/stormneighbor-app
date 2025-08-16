// File: backend/src/app.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const { sanitizeInput } = require("./middleware/sanitize");
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
const sslSecurity = require("./middleware/sslSecurity");
const sslConfig = require("./config/sslConfig");

const app = express();

app.set("trust proxy", sslConfig.getSSLConfig().trustedProxies);

sslSecurity.initialize(app);

const helmetConfig = getSecurityConfig();
app.use(helmet(helmetConfig));

const corsConfig = sslConfig.getCORSConfig();
app.use(cors(corsConfig));

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
    skip: (req, _res) => req.url.includes("/health") || req.url.includes("/cache/stats"),
  })
);

app.use(securityMiddleware.enhancedInputValidation());
app.use(securityMiddleware.sqlInjectionDetection());
app.use(securityMiddleware.apiAbuseDetection());
app.use(securityMiddleware.auditLogger());

app.use(requestLogger);
app.use(performanceMonitor);
app.use(analyticsTracker.middleware);

app.use(sanitizeInput);

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "StormNeighbor API Server is running",
    version: "1.0.0",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", healthCheck);

app.get("/api/v1/cache/stats", getCacheStats);
app.post("/api/v1/cache/clear", clearCache);

try {
  console.log("Loading authentication routes...");
  const authRoutes = require("./routes/auth");
  const { sanitizeSensitive } = require("./middleware/sanitize");
  app.use("/api/v1/auth", sanitizeSensitive, authRoutes);

  console.log("Loading user routes...");
  const userRoutes = require("./routes/users");
  app.use("/api/v1/users", userRoutes);

  console.log("Loading post routes...");
  const postRoutes = require("./routes/posts");
  app.use("/api/v1/posts", postRoutes);

  console.log("Loading comment routes...");
  const commentRoutes = require("./routes/comments");
  app.use("/api/v1/comments", commentRoutes);

  console.log("Loading upload routes...");
  const uploadRoutes = require("./routes/upload");
  app.use("/api/v1/upload", uploadRoutes);

  console.log("Loading weather routes...");
  const weatherRoutes = require("./routes/weather");
  app.use("/api/v1/weather", weatherRoutes);

  console.log("Loading neighborhood routes...");
  const neighborhoodRoutes = require("./routes/neighborhoods");
  app.use("/api/v1/neighborhoods", neighborhoodRoutes);

  console.log("Loading alert routes...");
  const alertRoutes = require("./routes/alerts");
  app.use("/api/v1/alerts", alertRoutes);

  console.log("Loading search routes...");
  const searchRoutes = require("./routes/search");
  app.use("/api/v1/search", searchRoutes);

  console.log("Loading notification routes...");
  const notificationRoutes = require("./routes/notifications");
  app.use("/api/v1/notifications", notificationRoutes);

  console.log("Loading admin routes...");
  const adminRoutes = require("./routes/admin");
  app.use("/api/v1/admin", adminRoutes);

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
  if (
    err.message.includes("Invalid JSON") ||
    err.message.includes("too large") ||
    err.type === "entity.parse.failed"
  ) {
    securityMiddleware.logSecurityEvent(req, "MALFORMED_REQUEST", {
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
  if (
    req.path.includes("/admin") ||
    req.path.includes("/wp-") ||
    req.path.includes("/.env") ||
    req.path.includes("/config")
  ) {
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
