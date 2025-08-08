// File: backend/src/server.js
require("dotenv").config();

const validateEnvironment = require("./config/validateEnv");
validateEnvironment();

const app = require("./app");

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Health check: http://localhost:${PORT}/health`);

  if (process.env.NODE_ENV === "development") {
    console.log(`Analytics: http://localhost:${PORT}/analytics`);
    console.log(`Cache stats: http://localhost:${PORT}/cache/stats`);
  }

  console.log("Security: Enhanced headers and input sanitization enabled");
  console.log("Logging: Request tracking and performance monitoring enabled");
  console.log("Caching: Intelligent response caching system enabled");
  console.log("SUCCESS API: REST endpoints ready");
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("Process terminated");
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully...");
  server.close(() => {
    console.log("Process terminated");
  });
});

module.exports = { app, server };
