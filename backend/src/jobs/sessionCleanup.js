const cron = require("node-cron");
const tokenService = require("../services/tokenService");
const logger = require("../utils/logger");
const cronParser = require("cron-parser");

class SessionCleanupJob {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
    this.startupTimeout = null;
    this.cronExpression = "0 2 * * *";
  }

  start() {
    logger.info("Starting session cleanup job");

    this.cronJob = cron.schedule(
      this.cronExpression,
      async () => {
        if (this.isRunning) {
          logger.info("Session cleanup already running, skipping this schedule");
          return;
        }
        await this.runCleanup();
      },
      {
        scheduled: true,
        timezone: "UTC",
      }
    );

    logger.info("Session cleanup job scheduled for 2:00 AM UTC daily");

    this.startupTimeout = setTimeout(() => {
      this.startupTimeout = null;
      this.runCleanup().catch((err) => {
        logger.error("Startup session cleanup failed:", err);
      });
    }, 5000);
  }

  async runCleanup(retryCount = 0) {
    const maxRetries = 2;
    const startTime = Date.now();

    if (this.isRunning) {
      logger.info("Cleanup already running, skipping invocation");
      return;
    }

    this.isRunning = true;
    try {
      logger.info("Starting session cleanup...");
      const cleanedCount = await tokenService.cleanupExpiredSessions();
      const duration = Date.now() - startTime;

      logger.info(
        `SUCCESS: Session cleanup completed in ${duration}ms. Sessions removed: ${cleanedCount || 0}`
      );
    } catch (error) {
      logger.error("ERROR: Session cleanup failed:", error);

      if (retryCount < maxRetries) {
        logger.info(`Retrying session cleanup (${retryCount + 1}/${maxRetries})...`);
        return this.runCleanup(retryCount + 1);
      }
    } finally {
      this.isRunning = false;
    }
  }

  async manualCleanup() {
    if (this.isRunning) {
      throw new Error("Cleanup is already running");
    }
    return this.runCleanup();
  }

  stop() {
    logger.info("Stopping session cleanup job");

    if (this.startupTimeout) {
      clearTimeout(this.startupTimeout);
      this.startupTimeout = null;
      logger.info("Cancelled pending startup cleanup");
    }

    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info("Cron job stopped");
    }
  }

  getStatus() {
    let nextRun = null;
    if (this.cronJob) {
      try {
        const interval = cronParser.parseExpression(this.cronExpression, { tz: "UTC" });
        nextRun = interval.next().toString();
      } catch (err) {
        logger.error("Failed to calculate next run time:", err);
      }
    }

    return {
      scheduled: !!this.cronJob,
      running: this.isRunning,
      nextRun,
      startupPending: !!this.startupTimeout,
    };
  }
}

module.exports = new SessionCleanupJob();
