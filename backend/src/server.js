require("dotenv").config();

const validateEnvironment = require("./config/validateEnv");
validateEnvironment();

const app = require("./app");
const sessionCleanupJob = require("./jobs/sessionCleanup");
const pushNotificationService = require("./services/pushNotificationService");

const PORT = process.env.PORT || 3000;
const HOST = process.env.NODE_ENV === "production" ? "0.0.0.0" : "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
  console.log(`INFO: Server running on port: ${PORT}`);
  console.log(`INFO: Server accessible at: http://localhost:${PORT}`);

  if (process.env.NODE_ENV === "development") {
    console.log(`INFO: Network access: http://192.168.1.89:${PORT}`);
    console.log(`INFO: Base URL from env: ${process.env.BASE_URL || "Not set"}`);
  }

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

  try {
    console.log("WORKING: Initializing push notification service");
    const pushStatus = pushNotificationService.getStatus();

    if (pushStatus.initialized) {
      console.log("SUCCESS: Push notification service initialized");
      console.log(`INFO: Firebase Project: ${pushStatus.projectId}`);
    } else {
      console.warn("WARNING: Push notification service failed to initialize");
    }
  } catch (error) {
    console.error("ERROR: Error initializing push notifications:", error.message);
  }

  console.log("\nINFO: Backend is ready");
  console.log("INFO: Available Endpoints:");
  console.log("\nAuthentication:");
  console.log(" POST /api/v1/auth/register");
  console.log(" POST /api/v1/auth/login");
  console.log(" POST /api/v1/auth/logout");
  console.log(" POST /api/v1/auth/logout-all");
  console.log(" POST /api/v1/auth/refresh-token");

  console.log("\nPush Notifications:");
  console.log(" POST /api/v1/notifications/register");
  console.log(" GET /api/v1/notifications/devices");
  console.log(" POST /api/v1/notifications/subscribe");
  console.log(" POST /api/v1/notifications/test (admin)");

  console.log("Session cleanup runs daily at 2:00 AM UTC");
  console.log("Max 5 active sessions per user");
  console.log("Check /health for system status");
  console.log("Admin access requires special role assignment");

  if (process.env.NODE_ENV === "development") {
    console.log("\nDevelopment Tools:");
    console.log(" POST /api/v1/auth/send-test-email - Send test email");
    console.log(" GET  /analytics - API usage statistics");
    console.log(" GET  /cache/stats - Cache performance");
    console.log(" GET  /api/v1/auth/test-email - Test email service");
    console.log(" DELETE /cache - Clear cache");
    console.log(" GET  /api/v1/notifications/status - Push notification status");
    console.log(" npm run push:test - Test push notifications");
  }
});

const gracefulShutdown = () => {
  console.log("\nINFO: Received shutdown signal, closing server gracefully");

  server.close((err) => {
    if (err) {
      console.error("ERROR: Error during server shutdown:", err);
      process.exitCode = 1;
    }

    console.log("INFO: Server closed successfully");

    try {
      sessionCleanupJob.stop();
      console.log("INFO: Background jobs stopped");
    } catch (error) {
      console.error("ERROR: Error stopping background jobs:", error);
    }

    process.exitCode = 1;
  });

  setTimeout(() => {
    console.error("WARNING: Forcing server shutdown");
    process.exitCode = 1;
  }, 10000);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

process.on("uncaughtException", (error) => {
  console.error("ERROR: Uncaught Exception:", error);
  process.exitCode = 1;
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("ERROR: Unhandled Rejection at:", promise, "reason:", reason);
  process.exitCode = 1;
});

module.exports = server;
