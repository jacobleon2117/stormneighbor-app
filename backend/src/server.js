// File: backend/src/server.js
require("dotenv").config();

const validateEnvironment = require("./config/validateEnv");
validateEnvironment();

const app = require("./app");
const sessionCleanupJob = require("./jobs/sessionCleanup");

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Health check: http://localhost:${PORT}/health`);

  if (process.env.NODE_ENV === "development") {
    console.log(`Analytics: http://localhost:${PORT}/analytics`);
    console.log(`Cache stats: http://localhost:${PORT}/cache/stats`);
  }

  console.log("Security: Enhanced headers and input sanitization enabled");
  console.log("Logging: Request tracking and performance monitoring enabled");
  console.log("Caching: Intelligent response caching system enabled");
  console.log("Authentication: JWT access + refresh token system enabled");
  console.log("SUCCESS API: REST endpoints ready");

  console.log("\nStarting background jobs...");
  try {
    sessionCleanupJob.start();
    console.log("Session cleanup job started");

    const jobStatus = sessionCleanupJob.getStatus();
    if (jobStatus.scheduled) {
      console.log(`Next cleanup: ${jobStatus.nextRun}`);
    }

    console.log("All background jobs initialized successfully");
  } catch (error) {
    console.error("ERROR: Error starting background jobs:", error);
  }

  console.log("\nBackend is ready");
  console.log("=======================================");

  console.log("\nAvailable Endpoints:");
  console.log("Authentication:");
  console.log("   POST /api/auth/register");
  console.log("   POST /api/auth/login");
  console.log("   POST /api/auth/logout");
  console.log("   POST /api/auth/logout-all");
  console.log("   POST /api/auth/refresh-token");
  console.log("   GET  /api/auth/sessions");
  console.log("   DELETE /api/auth/sessions");
  console.log("Profile:");
  console.log("   GET  /api/auth/profile");
  console.log("   PUT  /api/auth/profile");
  console.log("   POST /api/auth/change-password");
  console.log("Email:");
  console.log("   POST /api/auth/forgot-password");
  console.log("   POST /api/auth/verify-code");
  console.log("   POST /api/auth/reset-password");
  console.log("   POST /api/auth/resend-verification");
  console.log("Posts:");
  console.log("   GET  /api/posts");
  console.log("   POST /api/posts");
  console.log("   GET  /api/posts/:id");
  console.log("Weather:");
  console.log("   GET  /api/weather/current");
  console.log("Alerts:");
  console.log("   GET  /api/alerts");
  console.log("   POST /api/alerts");
  console.log("Uploads:");
  console.log("   POST /api/upload/profile");
  console.log("   GET  /api/upload/profile");
  console.log("Search:");
  console.log("   GET  /api/search/posts");
  console.log("   GET  /api/search/users");
  console.log("Notifications:");
  console.log("   GET  /api/notifications");
  console.log("   POST /api/notifications/register-device");

  console.log("Admin (Authenticated):");
  console.log("   GET  /api/v1/admin/dashboard");
  console.log("   GET  /api/v1/admin/users");
  console.log("   PATCH /api/v1/admin/users/:userId/status");
  console.log("   GET  /api/v1/admin/moderation");
  console.log("   PATCH /api/v1/admin/moderation/:queueId");
  console.log("   GET  /api/v1/admin/settings");
  console.log("   PATCH /api/v1/admin/settings/:settingKey");
  console.log("   GET  /api/v1/admin/analytics");
  console.log("   GET  /api/v1/admin/roles");
  console.log("   POST /api/v1/admin/users/:userId/roles");

  console.log("\nTips:");
  console.log("   Access tokens expire in 15 minutes");
  console.log("   Refresh tokens expire in 7 days");
  console.log("   Session cleanup runs daily at 2:00 AM UTC");
  console.log("   Max 5 active sessions per user");
  console.log("   Check /health for system status");
  console.log("   Admin access requires special role assignment");

  if (process.env.NODE_ENV === "development") {
    console.log("\nDevelopment Tools:");
    console.log("   GET  /analytics - API usage statistics");
    console.log("   GET  /cache/stats - Cache performance");
    console.log("   DELETE /cache - Clear cache");
    console.log("   GET  /api/auth/test-email - Test email service");
    console.log("   POST /api/auth/send-test-email - Send test email");
  }
});

const { gracefulShutdown: shutdownDatabase } = require("./config/database");

let isShuttingDown = false;

const performGracefulShutdown = async (signal) => {
  if (isShuttingDown) {
    console.log(`${signal} received but shutdown already in progress...`);
    return;
  }

  isShuttingDown = true;
  console.log(`\n${signal} received, shutting down gracefully...`);
  console.log("Stopping background jobs...");

  try {
    sessionCleanupJob.stop();
    console.log("Session cleanup job stopped");
  } catch (error) {
    console.error("ERROR: Error stopping background jobs:", error);
    process.exitCode = 1;
  }

  try {
    const { cache } = require("./middleware/cache");
    if (cache && cache.clearCleanupInterval) {
      cache.clearCleanupInterval();
      console.log("Cache cleanup interval cleared");
    }
  } catch (error) {
    console.error("ERROR: Error clearing cache interval:", error);
  }

  try {
    const securityMiddleware = require("./middleware/security");
    if (securityMiddleware && securityMiddleware.clearCleanupInterval) {
      securityMiddleware.clearCleanupInterval();
      console.log("Security cleanup interval cleared");
    }
  } catch (error) {
    console.error("ERROR: Error clearing security interval:", error);
  }

  server.close(async () => {
    console.log("Server connections closed");

    try {
      await shutdownDatabase();
      console.log("Process terminated gracefully");
      process.exitCode = 0;

      setTimeout(() => {
        console.log("Force exiting after graceful shutdown completed");
        process.exitCode = 1;
      }, 1000);
    } catch (error) {
      console.error("ERROR: Error during database shutdown:", error);
      process.exitCode = 1;
      setTimeout(() => {
        process.exitCode = 1;
      }, 1000);
    }
  });
};

process.on("SIGTERM", () => performGracefulShutdown("SIGTERM"));
process.on("SIGINT", () => performGracefulShutdown("SIGINT"));

process.on("uncaughtException", async (error) => {
  console.error("FAILED: Uncaught Exception:", error);
  console.log("ERROR: Shutting down due to uncaught exception...");

  if (!isShuttingDown) {
    isShuttingDown = true;
    try {
      sessionCleanupJob.stop();
      await shutdownDatabase();
    } catch (jobError) {
      console.error("ERROR: Error stopping services during crash:", jobError);
    }
  }

  process.exitCode = 1;
  throw error;
});

process.on("unhandledRejection", async (reason, promise) => {
  console.error("FAILED: Unhandled Rejection at:", promise, "reason:", reason);
  console.log("ERROR: Shutting down due to unhandled promise rejection...");

  if (!isShuttingDown) {
    isShuttingDown = true;
    try {
      sessionCleanupJob.stop();
      await shutdownDatabase();
    } catch (jobError) {
      console.error("ERROR: Error stopping services during crash:", jobError);
    }
  }

  server.close(() => {
    process.exitCode = 1;
    throw new Error(`Unhandled promise rejection: ${reason}`);
  });
});

module.exports = { app, server };
