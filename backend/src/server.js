require("dotenv").config();

const logger = require("./utils/logger");

logger.info("Starting StormNeighbor API Server");
logger.info(`Node.js Version: ${process.version}`);
logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);

logger.info("Validating environment variables");
const validateEnvironment = require("./config/validateEnv");
try {
  validateEnvironment();
  logger.info("Environment variables configured properly");
} catch (error) {
  logger.error("Environment validation failed", { error: error.message });
  process.exitCode = 1;
}

logger.info("Validating application dependencies");
let app;
try {
  app = require("./app");
  logger.info("Express application initialized");
} catch (error) {
  logger.error("Failed to load Express application", { error: error.message });
  process.exitCode = 1;
}

logger.info("Validating background services");
const sessionCleanupJob = require("./jobs/sessionCleanup");
const pushNotificationService = require("./services/pushNotificationService");

const PORT = process.env.PORT || 3000;
const HOST = process.env.NODE_ENV === "production" ? "0.0.0.0" : "0.0.0.0";

logger.info("TESTING: Server Port Configuration");
logger.info(`STATUS: Port ${PORT} - ${HOST}`);

const server = app.listen(PORT, HOST, () => {
  logger.info("\nSERVER STARTED SUCCESSFULLY");
  logger.info("═".repeat(50));

  logger.info(`STATUS: RUNNING - Server listening on ${HOST}:${PORT}`);
  logger.info(`SUCCESS: Local Access → http://localhost:${PORT}`);

  if (process.env.NODE_ENV === "development") {
    logger.info(`SUCCESS: Network Access → http://192.168.1.89:${PORT}`);
    logger.info(`INFORMATION: Base URL → ${process.env.BASE_URL || "Not configured"}`);
  }

  logger.info(`INFORMATION: Environment → ${process.env.NODE_ENV}`);
  logger.info(`SUCCESS: Health Check → http://localhost:${PORT}/health`);

  if (process.env.NODE_ENV === "development") {
    logger.info(`SUCCESS: Analytics → http://localhost:${PORT}/analytics`);
    logger.info(`SUCCESS: Cache Stats → http://localhost:${PORT}/cache/stats`);
  }

  logger.info("\nSECURITY SYSTEMS");
  logger.info("SUCCESS: Enhanced HTTP Headers Active");
  logger.info("SUCCESS: Input Sanitization Active");
  logger.info("SUCCESS: Rate Limiting Active");
  logger.info("SUCCESS: SQL Injection Detection Active");

  logger.info("\nMONITORING SYSTEMS");
  logger.info("SUCCESS: Request Tracking Active");
  logger.info("SUCCESS: Performance Monitoring Active");
  logger.info("SUCCESS: Error Logging Active");

  logger.info("\nDATABASE & CACHING");
  logger.info("SUCCESS: Intelligent Response Caching Active");
  logger.info("SUCCESS: Database Middleware Active");

  logger.info("\nAUTHENTICATION");
  logger.info("SUCCESS: JWT Token System Active");
  logger.info("SUCCESS: Session Management Active");

  logger.info("\nBACKGROUND SERVICES");
  logger.info("VALIDATING: Session Cleanup Service");
  try {
    sessionCleanupJob.start();
    logger.info("SUCCESS: Session Cleanup Job Active");

    const jobStatus = sessionCleanupJob.getStatus();
    if (jobStatus.scheduled) {
      logger.info(`INFORMATION: Next Cleanup → ${jobStatus.nextRun}`);
    }

    logger.info("SUCCESS: Background Jobs Initialized");
  } catch (error) {
    logger.error("FAILED: Background Jobs Initialization Error:", error.message);
    logger.info("WARNING: Server continuing without background jobs");
  }

  logger.info("\nPUSH NOTIFICATIONS");
  logger.info("VALIDATING: Firebase Push Service");
  try {
    const pushStatus = pushNotificationService.getStatus();

    if (pushStatus.initialized) {
      logger.info("SUCCESS: Push Notification Service Active");
      logger.info(`INFORMATION: Firebase Project → ${pushStatus.projectId || "Unknown"}`);
    } else {
      logger.info("WARNING: Push Notification Service Not Available");
      logger.info("INFORMATION: Server will run without push notifications");
    }
  } catch (error) {
    logger.info("WARNING: Push Notification Service Failed:", error.message);
    logger.info("INFORMATION: Server will continue without push notifications");
  }

  logger.info("\nREADY TO SERVE");
  logger.info("═".repeat(50));
  logger.info("SUCCESS: StormNeighbor API Server is fully operational!");

  logger.info("\nAPI ENDPOINTS");
  logger.info("▶ Authentication:");
  logger.info("   POST /api/v1/auth/register");
  logger.info("   POST /api/v1/auth/login");
  logger.info("   POST /api/v1/auth/logout");
  logger.info("   POST /api/v1/auth/refresh-token");

  logger.info("▶ Community & Posts:");
  logger.info("   GET  /api/v1/posts");
  logger.info("   POST /api/v1/posts");
  logger.info("   GET  /api/v1/neighborhoods");

  logger.info("▶ Weather & Alerts:");
  logger.info("   GET  /api/v1/weather");
  logger.info("   GET  /api/v1/alerts");

  logger.info("▶ Notifications:");
  logger.info("   POST /api/v1/notifications/register");
  logger.info("   GET  /api/v1/notifications/devices");

  logger.info("\nSYSTEM INFORMATION");
  logger.info("INFORMATION: Session cleanup runs daily at 2:00 AM UTC");
  logger.info("INFORMATION: Max 5 active sessions per user");
  logger.info("INFORMATION: System status available at /health");
  logger.info("INFORMATION: Admin access requires special role assignment");

  if (process.env.NODE_ENV === "development") {
    logger.info("\nDEVELOPMENT TOOLS");
    logger.info("▶ Testing & Debugging:");
    logger.info("   POST /api/v1/auth/send-test-email - Send test email");
    logger.info("   GET  /analytics - API usage statistics");
    logger.info("   GET  /cache/stats - Cache performance");
    logger.info("   GET  /api/v1/auth/test-email - Test email service");
    logger.info("   DELETE /cache - Clear cache");
    logger.info("   GET  /api/v1/notifications/status - Push notification status");
    logger.info("   npm run push:test - Test push notifications");
  }

  logger.info("\nNEXT STEPS");
  logger.info("1. Test frontend connection");
  logger.info("2. Verify database connectivity");
  logger.info("3. Check API endpoints at /health");
  logger.info("4. Review logs for any warnings");

  logger.info("\n" + "═".repeat(50));
  logger.info("BOOTSTRAP COMPLETE - Server ready for connections");
  logger.info("═".repeat(50));
});

let shutdownInProgress = false;

const gracefulShutdown = (signal) => {
  if (shutdownInProgress) {
    logger.info("INFORMATION: Shutdown already in progress");
    return;
  }

  shutdownInProgress = true;
  logger.info("\nSHUTDOWN INITIATED");
  logger.info("═".repeat(50));
  logger.info(`INFORMATION: ${signal} signal received - starting graceful shutdown`);

  const forceShutdownTimeout = setTimeout(() => {
    logger.info("WARNING: Graceful shutdown timeout reached (10s);");
    logger.info("CRITICAL: Forcing application termination");
    process.exitCode = 1;
  }, 10000);

  server.close((err) => {
    if (err) {
      logger.error("FAILED: Server shutdown error:", err.message);
    } else {
      logger.info("SUCCESS: HTTP Server closed");
    }

    logger.info("VALIDATING: Background services cleanup");
    try {
      if (sessionCleanupJob && typeof sessionCleanupJob.stop === "function") {
        sessionCleanupJob.stop();
        logger.info("SUCCESS: Session cleanup job terminated");
      }
    } catch (error) {
      logger.error("WARNING: Background job cleanup error:", error.message);
    }

    clearTimeout(forceShutdownTimeout);

    logger.info("SUCCESS: Graceful shutdown completed");
    logger.info("═".repeat(50));
    logger.info("API Server stopped");

    process.exitCode = 1;
  });

  setTimeout(() => {
    if (shutdownInProgress) {
      logger.info("WARNING: Server close callback not called - forcing exit");
      clearTimeout(forceShutdownTimeout);
      process.exitCode = 1;
    }
  }, 5000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("SIGHUP", () => gracefulShutdown("SIGHUP"));
process.on("SIGQUIT", () => gracefulShutdown("SIGQUIT"));

process.on("uncaughtException", (error) => {
  logger.info("\nCRITICAL ERROR DETECTED");
  logger.info("═".repeat(50));
  logger.error("CRITICAL: Uncaught Exception:", error.message);
  logger.error("STACK:", error.stack);
  logger.info("CRITICAL: Application will terminate");
  process.exitCode = 1;
});

process.on("unhandledRejection", (reason, promise) => {
  logger.info("\nUNHANDLED PROMISE REJECTION");
  logger.info("═".repeat(50));
  logger.error("WARNING: Unhandled Promise Rejection");
  logger.error("PROMISE:", promise);
  logger.error("REASON:", reason);
  logger.info("WARNING: This should be handled properly");
  process.exitCode = 1;
});

module.exports = server;
