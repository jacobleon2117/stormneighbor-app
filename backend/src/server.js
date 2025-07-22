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
const logger = require("./utils/logger");

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:19006",
    methods: ["GET", "POST"],
  },
});

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:19006",
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(compression());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

try {
  app.use("/api/auth", require("./routes/auth"));
  app.use("/api/users", require("./routes/users"));
  app.use("/api/neighborhoods", require("./routes/neighborhoods"));
  app.use("/api/posts", require("./routes/posts"));
  app.use("/api/alerts", require("./routes/alerts"));
  app.use("/api/weather", require("./routes/weather"));
} catch (routeError) {
  console.error("Error loading routes:", routeError);
  process.exit(1);
}

io.on("connection", (socket) => {
  console.log(`📱 User connected: ${socket.id}`);

  socket.on("join-neighborhood", (neighborhoodId) => {
    socket.join(`neighborhood-${neighborhoodId}`);
    console.log(`User ${socket.id} joined neighborhood-${neighborhoodId}`);
  });

  socket.on("emergency-alert", (data) => {
    socket
      .to(`neighborhood-${data.neighborhoodId}`)
      .emit("emergency-alert", data);
    console.log(`Emergency alert sent to neighborhood-${data.neighborhoodId}`);
  });

  socket.on("new-post", (data) => {
    socket.to(`neighborhood-${data.neighborhoodId}`).emit("new-post", data);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

app.use((err, req, res, next) => {
  console.error("Error:", err);

  if (process.env.NODE_ENV === "production") {
    res.status(500).json({ message: "Internal server error" });
  } else {
    res.status(500).json({
      message: err.message,
      stack: err.stack,
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});
