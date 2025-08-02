// File: backend/src/server.js
require("dotenv").config();

const validateEnvironment = require("./config/validateEnv");
validateEnvironment();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const { createServer } = require("http");
const { Server } = require("socket.io");

const { sanitizeInput, sanitizeSensitive } = require("./middleware/sanitize");
const {
  requestLogger,
  errorLogger,
  performanceMonitor,
  analyticsTracker,
  healthCheck,
} = require("./middleware/logging");

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:19006",
    methods: ["GET", "POST"],
  },
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: [
          "'self'",
          "https://res.cloudinary.com",
          "https://api.weather.gov",
        ],
        connectSrc: ["'self'", "https://api.weather.gov"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
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

app.use(requestLogger);
app.use(performanceMonitor);
app.use(analyticsTracker.middleware);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

app.use(sanitizeInput);

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use((req, res, next) => {
  res.removeHeader("X-Powered-By");

  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  next();
});

app.get("/health", healthCheck);

app.get("/analytics", (req, res) => {
  if (process.env.NODE_ENV !== "development") {
    return res
      .status(403)
      .json({ message: "Analytics endpoint only available in development" });
  }

  res.json({
    message: "API Analytics",
    data: analyticsTracker.getStats(),
  });
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
  process.exit(1);
}

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join-location", (locationData) => {
    try {
      const city = DOMPurify.sanitize(locationData.city || "");
      const state = DOMPurify.sanitize(locationData.state || "");

      if (city && state) {
        const locationRoom = `location-${city}-${state}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "");
        socket.join(locationRoom);
        console.log(`User ${socket.id} joined location room: ${locationRoom}`);
      }
    } catch (error) {
      console.error("Error joining location room:", error);
    }
  });

  socket.on("emergency-alert", (data) => {
    try {
      const cleanData = {
        city: DOMPurify.sanitize(data.city || ""),
        state: DOMPurify.sanitize(data.state || ""),
        title: DOMPurify.sanitize(data.title || ""),
        severity: DOMPurify.sanitize(data.severity || ""),
        alertType: DOMPurify.sanitize(data.alertType || ""),
        alertId: parseInt(data.alertId) || null,
        userId: parseInt(data.userId) || null,
      };

      if (cleanData.city && cleanData.state) {
        const locationRoom = `location-${cleanData.city}-${cleanData.state}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "");
        socket.to(locationRoom).emit("emergency-alert", cleanData);
        console.log(
          `Emergency alert sent to location: ${cleanData.city}, ${cleanData.state}`
        );
      }
    } catch (error) {
      console.error("Error broadcasting emergency alert:", error);
    }
  });

  socket.on("new-post", (data) => {
    try {
      const cleanData = {
        city: DOMPurify.sanitize(data.city || ""),
        state: DOMPurify.sanitize(data.state || ""),
        postId: parseInt(data.postId) || null,
        title: DOMPurify.sanitize(data.title || ""),
        postType: DOMPurify.sanitize(data.postType || ""),
        isEmergency: Boolean(data.isEmergency),
        userId: parseInt(data.userId) || null,
      };

      if (cleanData.city && cleanData.state) {
        const locationRoom = `location-${cleanData.city}-${cleanData.state}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "");
        socket.to(locationRoom).emit("new-post", cleanData);
        console.log(
          `New post notification sent to location: ${cleanData.city}, ${cleanData.state}`
        );
      }
    } catch (error) {
      console.error("Error broadcasting new post:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

app.use(errorLogger);
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);

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
      stack: err.stack,
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

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Analytics: http://localhost:${PORT}/analytics`);
  console.log(`Security: Enhanced headers and input sanitization enabled`);
  console.log(`Logging: Request tracking and performance monitoring enabled`);
});

const createDOMPurify = require("isomorphic-dompurify");
const DOMPurify = createDOMPurify();
