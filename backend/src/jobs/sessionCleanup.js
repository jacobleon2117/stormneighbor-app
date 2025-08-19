const cron = require("node-cron");
const tokenService = require("../services/tokenService");

class SessionCleanupJob {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
    this.startupTimeout = null;
  }

  start() {
    console.log("Starting session cleanup job");

    this.cronJob = cron.schedule(
      "0 2 * * *",
      async () => {
        if (this.isRunning) {
          console.log("Session cleanup already running, skipping");
          return;
        }

        await this.runCleanup();
      },
      {
        scheduled: true,
        timezone: "UTC",
      }
    );

    console.log("Session cleanup job scheduled for 2:00 AM UTC daily");

    this.startupTimeout = setTimeout(() => {
      this.startupTimeout = null;
      this.runCleanup();
    }, 5000);
  }

  async runCleanup() {
    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log("Starting session cleanup...");

      await tokenService.cleanupExpiredSessions();

      const duration = Date.now() - startTime;
      console.log(`SUCCESS: Session cleanup completed in ${duration}ms`);
    } catch (error) {
      console.error("ERROR: Session cleanup failed:", error);
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
    console.log("Stopping session cleanup job");

    if (this.startupTimeout) {
      clearTimeout(this.startupTimeout);
      this.startupTimeout = null;
      console.log("Cancelled pending startup cleanup");
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
