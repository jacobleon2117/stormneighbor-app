const cron = require("node-cron");
const tokenService = require("../services/tokenService");
const logger = require("../utils/logger");

class SessionCleanupJob {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
    this.startupTimeout = null;
  }

  start() {
    logger.info("Starting session cleanup job");

    this.cronJob = cron.schedule(
      "0 2 * * *",
      async () => {
        if (this.isRunning) {
          logger.info("Session cleanup already running, skipping");
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
      this.runCleanup();
    }, 5000);
  }

  async runCleanup() {
    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info("Starting session cleanup...");

      await tokenService.cleanupExpiredSessions();

      const duration = Date.now() - startTime;
      logger.info(`SUCCESS: Session cleanup completed in ${duration}ms`);
    } catch (error) {
      logger.error("ERROR: Session cleanup failed:", error);
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
    }
  }

  getStatus() {
    return {
      scheduled: !!this.cronJob,
      running: this.isRunning,
      nextRun: this.cronJob ? "Daily at 2:00 AM UTC" : null,
      startupPending: !!this.startupTimeout,
    };
  }
}

module.exports = new SessionCleanupJob();
