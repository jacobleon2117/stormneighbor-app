require("dotenv").config();
const os = require("os");
const logger = require("./utils/logger");
const logSeparator = () => logger.info("═".repeat(50));

const validateEnvironment = require("./config/validateEnv");
try {
  validateEnvironment();
  logger.info("Environment variables configured properly");
} catch (error) {
  logger.error("Environment validation failed", { error: error.message });
  process.exitCode = 1;
}

const app = require("./app");
if (!app) {
  logger.error("Express app is undefined. Cannot start server.");
  process.exitCode = 1;
}

const sessionCleanupJob = require("./jobs/sessionCleanup");
const pushNotificationService = require("./services/pushNotificationService");

const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";
logger.info(`Server configured → ${HOST}:${PORT}`);

const server = app.listen(PORT, HOST, async () => {
  logger.info("\nSERVER STARTED SUCCESSFULLY");
  logSeparator();
  logger.info(`STATUS: RUNNING - Server listening on ${HOST}:${PORT}`);
  logger.info(`SUCCESS: Local Access → http://localhost:${PORT}`);

  if (process.env.NODE_ENV === "development") {
    const nets = os.networkInterfaces();
    Object.values(nets).forEach((ifaceList) => {
      ifaceList?.forEach((iface) => {
        if (iface.family === "IPv4" && !iface.internal) {
          logger.info(`DEV NETWORK ACCESS → http://${iface.address}:${PORT}`);
        }
      });
    });
  }

  try {
    sessionCleanupJob.start();
    logger.info("SUCCESS: Session Cleanup Job Active");
  } catch (e) {
    logger.warn("Session Cleanup Job failed:", e.message);
  }

  try {
    const pushStatus = pushNotificationService.getStatus();
    if (pushStatus.initialized) {
      logger.info("SUCCESS: Push Notification Service Active");
    } else {
      logger.info("WARNING: Push Notification Service Not Available");
    }
  } catch (e) {
    logger.info("Push Notification Service failed:", e.message);
  }
});

let shutdownInProgress = false;
const gracefulShutdown = (signal) => {
  if (shutdownInProgress) return;
  shutdownInProgress = true;
  logger.info(`\nSHUTDOWN INITIATED (${signal})`);
  logSeparator();

  const forceTimeout = setTimeout(() => (process.exitCode = 1), 15000);

  server.close(async (err) => {
    if (err) logger.error("Server shutdown error:", err.message);

    try {
      sessionCleanupJob?.stop?.();
    } catch (e) {
      logger.warn("Failed to stop session cleanup job:", e.message);
    }

    clearTimeout(forceTimeout);
    logger.info("Graceful shutdown completed");
    process.exitCode = 1;
  });
};

["SIGTERM", "SIGINT", "SIGHUP", "SIGQUIT"].forEach((sig) =>
  process.on(sig, () => gracefulShutdown(sig))
);

process.on("uncaughtException", (error) => {
  logger.error("CRITICAL: Uncaught Exception:", error);
  process.exitCode = 1;
});
process.on("unhandledRejection", (reason, promise) => {
  logger.error("WARNING: Unhandled Promise Rejection", { reason, promise });
  process.exitCode = 1;
});

module.exports = server;
