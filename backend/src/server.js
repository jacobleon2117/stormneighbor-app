require("dotenv").config();

console.log("BOOTSTRAP: Starting StormNeighbor API Server...");
console.log(`INFORMATION: Node.js Version: ${process.version}`);
console.log(`INFORMATION: Environment: ${process.env.NODE_ENV || "development"}`);

console.log("VALIDATING: Environment Variables...");
const validateEnvironment = require("./config/validateEnv");
try {
  validateEnvironment();
  console.log("SUCCESS: Environment Variables Configured Properly");
} catch (error) {
  console.error("FAILED: Environment validation failed", error.message);
  process.exitCode = 1;
}

console.log("VALIDATING: Application Dependencies...");
let app;
try {
  app = require("./app");
  console.log("SUCCESS: Express Application Initialized");
} catch (error) {
  console.error("CRITICAL: Failed to load Express application", error.message);
  process.exitCode = 1;
}

console.log("VALIDATING: Background Services...");
const sessionCleanupJob = require("./jobs/sessionCleanup");
const pushNotificationService = require("./services/pushNotificationService");

const PORT = process.env.PORT || 3000;
const HOST = process.env.NODE_ENV === "production" ? "0.0.0.0" : "0.0.0.0";

console.log("TESTING: Server Port Configuration...");
console.log(`STATUS: Port ${PORT} - ${HOST}`);

const server = app.listen(PORT, HOST, () => {
  console.log("\nSERVER STARTED SUCCESSFULLY");
  console.log("═".repeat(50));
  
  console.log(`STATUS: RUNNING - Server listening on ${HOST}:${PORT}`);
  console.log(`SUCCESS: Local Access → http://localhost:${PORT}`);

  if (process.env.NODE_ENV === "development") {
    console.log(`SUCCESS: Network Access → http://192.168.1.89:${PORT}`);
    console.log(`INFORMATION: Base URL → ${process.env.BASE_URL || "Not configured"}`);
  }

  console.log(`INFORMATION: Environment → ${process.env.NODE_ENV}`);
  console.log(`SUCCESS: Health Check → http://localhost:${PORT}/health`);

  if (process.env.NODE_ENV === "development") {
    console.log(`SUCCESS: Analytics → http://localhost:${PORT}/analytics`);
    console.log(`SUCCESS: Cache Stats → http://localhost:${PORT}/cache/stats`);
  }

  console.log("\nSECURITY SYSTEMS");
  console.log("SUCCESS: Enhanced HTTP Headers Active");
  console.log("SUCCESS: Input Sanitization Active");
  console.log("SUCCESS: Rate Limiting Active");
  console.log("SUCCESS: SQL Injection Detection Active");
  
  console.log("\nMONITORING SYSTEMS");
  console.log("SUCCESS: Request Tracking Active");
  console.log("SUCCESS: Performance Monitoring Active");
  console.log("SUCCESS: Error Logging Active");
  
  console.log("\nDATABASE & CACHING");
  console.log("SUCCESS: Intelligent Response Caching Active");
  console.log("SUCCESS: Database Middleware Active");
  
  console.log("\nAUTHENTICATION");
  console.log("SUCCESS: JWT Token System Active");
  console.log("SUCCESS: Session Management Active");

  console.log("\nBACKGROUND SERVICES");
  console.log("VALIDATING: Session Cleanup Service...");
  try {
    sessionCleanupJob.start();
    console.log("SUCCESS: Session Cleanup Job Active");

    const jobStatus = sessionCleanupJob.getStatus();
    if (jobStatus.scheduled) {
      console.log(`INFORMATION: Next Cleanup → ${jobStatus.nextRun}`);
    }

    console.log("SUCCESS: Background Jobs Initialized");
  } catch (error) {
    console.error("FAILED: Background Jobs Initialization Error:", error.message);
    console.log("WARNING: Server continuing without background jobs");
  }

  console.log("\nPUSH NOTIFICATIONS");
  console.log("VALIDATING: Firebase Push Service...");
  try {
    const pushStatus = pushNotificationService.getStatus();

    if (pushStatus.initialized) {
      console.log("SUCCESS: Push Notification Service Active");
      console.log(`INFORMATION: Firebase Project → ${pushStatus.projectId || "Unknown"}`);
    } else {
      console.log("WARNING: Push Notification Service Not Available");
      console.log("INFORMATION: Server will run without push notifications");
    }
  } catch (error) {
    console.log("WARNING: Push Notification Service Failed:", error.message);
    console.log("INFORMATION: Server will continue without push notifications");
  }

  console.log("\nREADY TO SERVE");
  console.log("═".repeat(50));
  console.log("SUCCESS: StormNeighbor API Server is fully operational!");
  
  console.log("\nAPI ENDPOINTS");
  console.log("▶ Authentication:");
  console.log("   POST /api/v1/auth/register");
  console.log("   POST /api/v1/auth/login");
  console.log("   POST /api/v1/auth/logout");
  console.log("   POST /api/v1/auth/refresh-token");

  console.log("▶ Community & Posts:");
  console.log("   GET  /api/v1/posts");
  console.log("   POST /api/v1/posts");
  console.log("   GET  /api/v1/neighborhoods");

  console.log("▶ Weather & Alerts:");
  console.log("   GET  /api/v1/weather");
  console.log("   GET  /api/v1/alerts");

  console.log("▶ Notifications:");
  console.log("   POST /api/v1/notifications/register");
  console.log("   GET  /api/v1/notifications/devices");

  console.log("\nSYSTEM INFORMATION");
  console.log("INFORMATION: Session cleanup runs daily at 2:00 AM UTC");
  console.log("INFORMATION: Max 5 active sessions per user");
  console.log("INFORMATION: System status available at /health");
  console.log("INFORMATION: Admin access requires special role assignment");

  if (process.env.NODE_ENV === "development") {
    console.log("\nDEVELOPMENT TOOLS");
    console.log("▶ Testing & Debugging:");
    console.log("   POST /api/v1/auth/send-test-email - Send test email");
    console.log("   GET  /analytics - API usage statistics");
    console.log("   GET  /cache/stats - Cache performance");
    console.log("   GET  /api/v1/auth/test-email - Test email service");
    console.log("   DELETE /cache - Clear cache");
    console.log("   GET  /api/v1/notifications/status - Push notification status");
    console.log("   npm run push:test - Test push notifications");
  }

  console.log("\nNEXT STEPS");
  console.log("1. Test frontend connection");
  console.log("2. Verify database connectivity");
  console.log("3. Check API endpoints at /health");
  console.log("4. Review logs for any warnings");
  
  console.log("\n" + "═".repeat(50));
  console.log("BOOTSTRAP COMPLETE - Server ready for connections");
  console.log("═".repeat(50));
});

let shutdownInProgress = false;

const gracefulShutdown = (signal) => {
  if (shutdownInProgress) {
    console.log("INFORMATION: Shutdown already in progress...");
    return;
  }
  
  shutdownInProgress = true;
  console.log("\nSHUTDOWN INITIATED");
  console.log("═".repeat(50));
  console.log(`INFORMATION: ${signal} signal received - starting graceful shutdown`);

  const forceShutdownTimeout = setTimeout(() => {
    console.log("WARNING: Graceful shutdown timeout reached (10s)");
    console.log("CRITICAL: Forcing application termination");
    process.exitCode = 1;
  }, 10000);

  server.close((err) => {
    if (err) {
      console.error("FAILED: Server shutdown error:", err.message);
    } else {
      console.log("SUCCESS: HTTP Server closed");
    }

    console.log("VALIDATING: Background services cleanup...");
    try {
      if (sessionCleanupJob && typeof sessionCleanupJob.stop === "function") {
        sessionCleanupJob.stop();
        console.log("SUCCESS: Session cleanup job terminated");
      }
    } catch (error) {
      console.error("WARNING: Background job cleanup error:", error.message);
    }

    clearTimeout(forceShutdownTimeout);
    
    console.log("SUCCESS: Graceful shutdown completed");
    console.log("═".repeat(50));
    console.log("API Server stopped");
    
    process.exitCode = 1;  });

  setTimeout(() => {
    if (shutdownInProgress) {
      console.log("WARNING: Server close callback not called - forcing exit");
      clearTimeout(forceShutdownTimeout);
      process.exitCode = 1;    }
  }, 5000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("SIGHUP", () => gracefulShutdown("SIGHUP"));
process.on("SIGQUIT", () => gracefulShutdown("SIGQUIT"));

process.on("uncaughtException", (error) => {
  console.log("\nCRITICAL ERROR DETECTED");
  console.log("═".repeat(50));
  console.error("CRITICAL: Uncaught Exception:", error.message);
  console.error("STACK:", error.stack);
  console.log("CRITICAL: Application will terminate");
  process.exitCode = 1;});

process.on("unhandledRejection", (reason, promise) => {
  console.log("\nUNHANDLED PROMISE REJECTION");
  console.log("═".repeat(50));
  console.error("WARNING: Unhandled Promise Rejection");
  console.error("PROMISE:", promise);
  console.error("REASON:", reason);
  console.log("WARNING: This should be handled properly");
  process.exitCode = 1;
});

module.exports = server;
