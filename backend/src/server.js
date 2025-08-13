// File: backend/src/server.js
require("dotenv").config();

const validateEnvironment = require("./config/validateEnv");
validateEnvironment();

const app = require("./app");
const sessionCleanupJob = require("./jobs/sessionCleanup");

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`INFO: Server running on port: ${PORT}`);
  console.log(`INFO: Environment: ${process.env.NODE_ENV}`);
  console.log(`INFO: Health check: http://localhost:${PORT}/health`);

  if (process.env.NODE_ENV === "development") {
    console.log(`INFO: Analytics: http://localhost:${PORT}/analytics`);
    console.log(`INFO: Cache stats: http://localhost:${PORT}/cache/stats`);
  }

  console.log("SECURITY: Enhanced headers and input sanitization enabled");
  console.log("LOGGING: Request tracking and performance monitoring enabled");
  console.log("CACHING: Intelligent response caching system enabled");
  console.log("AUTHENTICATION: JWT access + refresh token system enabled");
  console.log("SUCCESS API: REST endpoints ready");

  console.log("\nWORKING: Starting background jobs");
  try {
    sessionCleanupJob.start();
    console.log("WORKING: Session cleanup job started");

    const jobStatus = sessionCleanupJob.getStatus();
    if (jobStatus.scheduled) {
      console.log(`INFO: Next cleanup: ${jobStatus.nextRun}`);
    }

    console.log("SUCCESS: All background jobs initialized successfully");
  } catch (error) {
    console.error("ERROR: Error starting background jobs:", error);
  }

  console.log("\nINFO: Backend is ready");
  console.log("INFO: Available Endpoints:");
  console.log("\nAuthentication:");
  console.log(" POST /api/auth/register");
  console.log(" POST /api/auth/login");
  console.log(" POST /api/auth/logout");
  console.log(" POST /api/auth/logout-all");
  console.log(" POST /api/auth/refresh-token");
  console.log("   GET  /api/auth/sessions");
  console.log("     DELETE /api/auth/sessions");
  console.log("\nProfile:");
  console.log(" POST /api/auth/change-password");
  console.log("   GET  /api/auth/profile");
  console.log("     PUT  /api/auth/profile");
  console.log("\nEmail:");
  console.log(" POST /api/auth/forgot-password");
  console.log(" POST /api/auth/verify-code");
  console.log(" POST /api/auth/reset-password");
  console.log(" POST /api/auth/resend-verification");
  console.log("\nPosts:");
  console.log(" POST /api/posts");
  console.log("   GET  /api/posts");
  console.log("   GET  /api/posts/:id");
  console.log("\nWeather:");
  console.log(" GET  /api/weather/current");
  console.log("\nAlerts:");
  console.log(" POST /api/alerts");
  console.log("   GET  /api/alerts");
  console.log("\nUploads:");
  console.log(" POST /api/upload/profile");
  console.log("   GET  /api/upload/profile");
  console.log("Search:");
  console.log(" GET  /api/search/posts");
  console.log(" GET  /api/search/users");
  console.log("\nNotifications:");
  console.log(" POST /api/notifications/register-device");
  console.log("   GET  /api/notifications");
  console.log("\nAdmin (Authenticated):");
  console.log(" POST /api/v1/admin/users/:userId/roles");
  console.log("   PATCH /api/v1/admin/users/:userId/status");
  console.log("   PATCH /api/v1/admin/moderation/:queueId");
  console.log("   PATCH /api/v1/admin/settings/:settingKey");
  console.log("     GET  /api/v1/admin/dashboard");
  console.log("     GET  /api/v1/admin/users");
  console.log("     GET  /api/v1/admin/moderation");
  console.log("     GET  /api/v1/admin/settings");
  console.log("     GET  /api/v1/admin/analytics");
  console.log("     GET  /api/v1/admin/roles");
  console.log("\nINFO:");
  console.log("Access tokens expire in 15 minutes");
  console.log("Refresh tokens expire in 7 days");
  console.log("Session cleanup runs daily at 2:00 AM UTC");
  console.log("Max 5 active sessions per user");
  console.log("Check /health for system status");
  console.log("Admin access requires special role assignment");
  if (process.env.NODE_ENV === "development") {
    console.log("\nDevelopment Tools:");
    console.log(" POST /api/auth/send-test-email - Send test email");
    console.log("   GET  /analytics - API usage statistics");
    console.log("   GET  /cache/stats - Cache performance");
    console.log("   GET  /api/auth/test-email - Test email service");
    console.log("     DELETE /cache - Clear cache");
    console.log("\n");
  }
});

const { gracefulShutdown: shutdownDatabase } = require("./config/database");

let isShuttingDown = false;

const performGracefulShutdown = async (signal) => {
  if (isShuttingDown) {
    console.log(`${signal} received but shutdown already in progress`);
    return;
  }

  isShuttingDown = true;
  console.log(`\n${signal} received, shutting down gracefully`);
  console.log("WORKING: Stopping background jobs");

  try {
    sessionCleanupJob.stop();
    console.log("INFO: Session cleanup job stopped");
  } catch (error) {
    console.error("ERROR: Error stopping background jobs:", error);
    process.exitCode = 1;
  }

  try {
    const { cache } = require("./middleware/cache");
    if (cache && cache.clearCleanupInterval) {
      cache.clearCleanupInterval();
      console.log("INFO: Cache cleanup interval cleared");
    }
  } catch (error) {
    console.error("ERROR: Error clearing cache interval:", error);
  }

  try {
    const securityMiddleware = require("./middleware/security");
    if (securityMiddleware && securityMiddleware.clearCleanupInterval) {
      securityMiddleware.clearCleanupInterval();
      console.log("INFO: Security cleanup interval cleared");
    }
  } catch (error) {
    console.error("ERROR: Error clearing security interval:", error);
  }

  server.close(async () => {
    console.log("INFO: Server connections closed");

    try {
      await shutdownDatabase();
      console.log("INFO: Process terminated gracefully");
      process.exitCode = 0;

      setTimeout(() => {
        console.log("INFO: Force exiting after graceful shutdown completed");
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
  console.error("ERROR: Uncaught Exception:", error);
  console.log("ERROR: Shutting down due to uncaught exception");

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
  console.error("ERROR: Unhandled Rejection at:", promise, "reason:", reason);
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
    throw new Error(`ERROR: Unhandled promise rejection: ${reason}`);
  });
});

module.exports = { app, server };
