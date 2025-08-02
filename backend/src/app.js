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

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["self"],
        styleSrc: ["self", "unsafe-inline"],
        scriptSrc: ["self"],
        imgSrc: ["self", "https://res.cloudinary.com", "https://api.weather.gov"],
        connectSrc: ["self", "https://api.weather.gov"],
        fontSrc: ["self"],
        objectSrc: ["none"],
        mediaSrc: ["self"],
        frameSrc: ["none"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    frameguard: { action: "deny" },
    xssFilter: true,
    referrerPolicy: { policy: "same-origin" },
  })
);

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
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Too many upload requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", generalLimiter);
app.use("/api/auth/", authLimiter);
app.use("/api/upload/", uploadLimiter);

app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      try {
        JSON.parse(buf);
      } catch (e) {
        res.status(400).json({ message: "Invalid JSON" });
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

app.use(compression());

if (process.env.NODE_ENV !== "test") {
  app.use(requestLogger);
  app.use(performanceMonitor);
  app.use(analyticsTracker.middleware);
}

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined"));
}

app.use(sanitizeInput);

app.use((req, res, next) => {
  next();
});

app.use((req, res, next) => {
  res.removeHeader("X-Powered-By");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

app.get("/health", healthCheck);

app.get("/analytics", (req, res) => {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ message: "Analytics endpoint only available in development" });
  }
  res.json({
    message: "API Analytics",
    data: analyticsTracker.getStats(),
  });
});

app.get("/cache/stats", (req, res) => {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ message: "Cache stats endpoint only available in development" });
  }
  getCacheStats(req, res);
});

app.delete("/cache", (req, res) => {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ message: "Cache management only available in development" });
  }
  clearCache(req, res);
});

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
  if (process.env.NODE_ENV !== "test") {
    console.error("Global error handler:", err);
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON format" });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request too large" });
  }

  if (process.env.NODE_ENV === "production") {
    res.status(500).json({ message: "Internal server error" });
  } else {
    res.status(500).json({
      message: err.message,
      stack: process.env.NODE_ENV === "test" ? undefined : err.stack,
      requestId: req.requestId,
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.path,
    method: req.method,
  });
});

module.exports = app;
