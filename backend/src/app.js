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

const app = express();

// Security headers
const helmetConfig = getSecurityConfig();
app.use(helmet(helmetConfig));

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:19006",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: {
    success: false,
    message: "Too many upload requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use("/api/", generalLimiter);
app.use("/api/auth/", authLimiter);
app.use("/api/upload/", uploadLimiter);

// Body parsing
app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      try {
        JSON.parse(buf);
      } catch (e) {
        res.status(400).json({
          success: false,
          message: "Invalid JSON format",
        });
        throw new Error("Invalid JSON");
      }
    },
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
    parameterLimit: 1000,
  })
);

// Compression
app.use(compression());

// Logging and monitoring (skip in test environment)
if (process.env.NODE_ENV !== "test") {
  app.use(requestLogger);
  app.use(performanceMonitor);
  app.use(analyticsTracker.middleware);
}

// Request logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined"));
}

// Input sanitization
app.use(sanitizeInput);

// Additional security headers
app.use((req, res, next) => {
  res.removeHeader("X-Powered-By");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

// Health check endpoint
app.get("/health", healthCheck);

// Development-only endpoints
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

// API Routes
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

// Error logging (skip in test environment)
if (process.env.NODE_ENV !== "test") {
  app.use(errorLogger);
}

// Global error handler
app.use((err, req, res, _next) => {
  if (process.env.NODE_ENV !== "test") {
    console.error("Global error handler:", err);
  }

  // Handle specific error types
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON format",
    });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request too large",
    });
  }

  // Default error response
  if (process.env.NODE_ENV === "production") {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  } else {
    res.status(500).json({
      success: false,
      message: err.message,
      stack: process.env.NODE_ENV === "test" ? undefined : err.stack,
      requestId: req.requestId,
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
    method: req.method,
  });
});

module.exports = app;
